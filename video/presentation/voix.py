# Fabrique la voix off et la ligne de temps d'une présentation.
#
#   ElevenLabs (clé dans la variable ELEVENLABS_API_KEY) :
#     python3 voix.py --texte texte-reels.json --moteur elevenlabs
#   Piper (voix locale, gratuite) :
#     python3 voix.py --texte texte.json --moteur piper --modele fr_FR-tom-medium.onnx
#   Estimation (aucune voix : durées estimées, pour un aperçu muet) :
#     python3 voix.py --texte texte-reels.json --moteur estimation
#
# Lit le texte (segments), fait prononcer chaque segment, puis écrit :
#   sortie/<voix-…>.wav : toute la narration, pauses comprises
#   <timeline-…>.js     : début et fin de chaque segment et de chaque mot,
#                         lus par la page HTML pour caler les animations et
#                         les sous-titres karaoké
#
# Pour remplacer la voix de synthèse par la tienne, enregistre un segment
# dans voix-perso/<id>.wav (l'id est dans le fichier de texte) : il sera
# pris à la place, et toute l'animation se recalera dessus.
import argparse
import base64
import hashlib
import io
import json
import os
import subprocess
import wave

import numpy as np

ICI = os.path.dirname(os.path.abspath(__file__))
SR = 44100

# Voix ElevenLabs par défaut (« George », voix masculine posée de la
# bibliothèque) ; ELEVENLABS_VOICE_ID permet d'en choisir une autre.
VOIX_ELEVENLABS = 'JBFqnCBsd6RMkjVDRZzb'
MODELE_ELEVENLABS = 'eleven_multilingual_v2'
CARACTERES_PAR_SECONDE = 14.0   # débit moyen d'une voix française posée


def lire_wav(octets_ou_chemin):
    w = wave.open(octets_ou_chemin)
    sr, n, c = w.getframerate(), w.getnframes(), w.getnchannels()
    x = np.frombuffer(w.readframes(n), np.int16).astype(np.float32) / 32768
    if c > 1:
        x = x.reshape(-1, c).mean(axis=1)
    if sr != SR:
        x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
    return x


def decoder_mp3(octets):
    brut = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', 'pipe:0', '-f', 's16le', '-ac', '1', '-ar', str(SR), 'pipe:1'],
                          input=octets, capture_output=True, check=True).stdout
    return np.frombuffer(brut, np.int16).astype(np.float32) / 32768


def rogner(x, seuil=0.01):
    # enlève les silences au début et à la fin ; renvoie aussi le décalage (s)
    i = np.where(np.abs(x) > seuil)[0]
    if not len(i):
        return x, 0.0
    a = max(0, i[0] - 400)
    return x[a: i[-1] + 2000], a / SR


def mots_proportionnels(texte, duree):
    # répartit les mots sur la durée, au prorata de leur longueur
    mots = texte.split()
    poids = [len(m) + 1 for m in mots]
    total, t, res = sum(poids), 0.0, []
    for m, p in zip(mots, poids):
        d = duree * p / total
        res.append([m, round(t, 3), round(t + d * .92, 3)])
        t += d
    return res


def mots_alignes(parle, alignement, affiche):
    # temps de chaque mot prononcé, d'après l'alignement caractère par
    # caractère d'ElevenLabs, reportés sur les mots affichés
    car, debuts, fins = alignement
    mots, courant = [], None
    for c, d, f in zip(car, debuts, fins):
        if c.isspace():
            courant = None
            continue
        if courant is None:
            courant = [c, d, f]
            mots.append(courant)
        else:
            courant[0] += c
            courant[2] = f
    if len(mots) == len(affiche.split()):
        return [[m, round(d, 3), round(f, 3)] for m, (_, d, f) in zip(affiche.split(), mots)]
    fin = mots[-1][2] if mots else 0
    return mots_proportionnels(affiche, fin)


class Estimation:
    def dire(self, seg, avant, apres):
        duree = len(seg['texte']) / CARACTERES_PAR_SECONDE
        x = np.zeros(int(duree * SR), np.float32)
        x[0] = x[-1] = 0.02  # pour que rogner() garde toute la durée
        return x, mots_proportionnels(seg['texte'], duree)


class Piper:
    def __init__(self, modele, vitesse=1.08):
        from piper import PiperVoice, SynthesisConfig
        self.voix = PiperVoice.load(modele)
        self.reglages = SynthesisConfig(length_scale=vitesse, noise_scale=0.6, noise_w_scale=0.7)

    def dire(self, seg, avant, apres):
        tampon = io.BytesIO()
        with wave.open(tampon, 'wb') as w:
            self.voix.synthesize_wav(seg.get('voix', seg['texte']), w, syn_config=self.reglages)
        tampon.seek(0)
        x = lire_wav(tampon)
        return x, None


class ElevenLabs:
    def __init__(self):
        from elevenlabs import VoiceSettings
        from elevenlabs.client import ElevenLabs as Client
        cle = os.environ.get('ELEVENLABS_API_KEY')
        if not cle:
            raise SystemExit('Variable ELEVENLABS_API_KEY absente : ajoute ta clé ElevenLabs dans les réglages de l’environnement.')
        self.client = Client(api_key=cle)
        self.voix = os.environ.get('ELEVENLABS_VOICE_ID', VOIX_ELEVENLABS)
        self.reglages = VoiceSettings(stability=0.45, similarity_boost=0.8, style=0.35, use_speaker_boost=True)
        self.cache = os.path.join(ICI, 'sortie', 'cache-elevenlabs')
        os.makedirs(self.cache, exist_ok=True)

    @staticmethod
    def texte(seg):
        # « voix_el » aide la prononciation ; ElevenLabs ne lit pas la notation [[ … ]] de Piper
        if 'voix_el' in seg:
            return seg['voix_el']
        return seg['voix'] if '[[' not in seg.get('voix', '[[') else seg['texte']

    def dire(self, seg, avant, apres):
        texte = self.texte(seg)
        cle = hashlib.sha1(json.dumps([self.voix, MODELE_ELEVENLABS, texte, avant, apres]).encode()).hexdigest()[:16]
        fichier = os.path.join(self.cache, f"{seg['id']}-{cle}.json")
        if not os.path.exists(fichier):  # chaque segment n'est payé qu'une fois
            r = self.client.text_to_speech.convert_with_timestamps(
                voice_id=self.voix, model_id=MODELE_ELEVENLABS, text=texte, output_format='mp3_44100_128',
                voice_settings=self.reglages, previous_text=avant or None, next_text=apres or None)
            al = r.alignment
            with open(fichier, 'w', encoding='utf-8') as f:
                json.dump({'audio': r.audio_base_64, 'caracteres': al.characters,
                           'debuts': al.character_start_times_seconds, 'fins': al.character_end_times_seconds}, f)
        d = json.load(open(fichier, encoding='utf-8'))
        x = decoder_mp3(base64.b64decode(d['audio']))
        return x, mots_alignes(texte, (d['caracteres'], d['debuts'], d['fins']), seg['texte'])


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--texte', default='texte.json')
    a.add_argument('--moteur', choices=['piper', 'elevenlabs', 'estimation'], default='piper')
    a.add_argument('--modele', help='modèle .onnx de Piper')
    args = a.parse_args()

    donnees = json.load(open(os.path.join(ICI, args.texte), encoding='utf-8'))
    segments, reglages = donnees['segments'], donnees.get('reglages', {})
    debut, pause, pause_scene, fin = (reglages.get(k, v) for k, v in
                                      [('debut', 2.0), ('pause', 0.45), ('pause_scene', 1.6), ('fin', 7.0)])
    nom = os.path.splitext(args.texte)[0].replace('texte', 'voix')       # texte-2min.json → voix-2min
    timeline = os.path.splitext(args.texte)[0].replace('texte', 'timeline') + '.js'
    moteur = {'elevenlabs': ElevenLabs, 'estimation': Estimation}.get(args.moteur)
    moteur = moteur() if moteur else Piper(args.modele, reglages.get('vitesse_piper', 1.08))

    # 1. faire dire chaque segment
    audios, mots = [], []
    for i, s in enumerate(segments):
        perso = os.path.join(ICI, 'voix-perso', s['id'] + '.wav')
        if os.path.exists(perso):
            x, m = lire_wav(perso), None
        else:
            avant = ' '.join(x['texte'] for x in segments[max(0, i - 2):i])
            apres = segments[i + 1]['texte'] if i + 1 < len(segments) else ''
            x, m = moteur.dire(s, avant, apres)
        x, decalage = rogner(x)
        duree = len(x) / SR
        if m is None:
            m = mots_proportionnels(s['texte'], duree)
        else:
            m = [[w, max(0, round(d - decalage, 3)), max(0, round(f - decalage, 3))] for w, d, f in m]
        audios.append(x)
        mots.append(m)

    # 2. si une durée cible est donnée, allonger ou raccourcir les pauses entre
    #    scènes (entre 0,3 et 2,5 s) pour l'atteindre
    coupures = sum(1 for i in range(1, len(segments)) if segments[i]['scene'] != segments[i - 1]['scene'])
    parole = sum(len(x) for x in audios) / SR
    if reglages.get('duree_cible') and coupures:
        reste = reglages['duree_cible'] - (debut + parole + pause * (len(segments) - 1 - coupures) + fin)
        pause_scene = min(2.5, max(0.3, reste / coupures))

    # 3. assembler la narration et la ligne de temps
    morceaux, ligne, t = [np.zeros(int(debut * SR))], [], debut
    for i, (s, x, m) in enumerate(zip(segments, audios, mots)):
        if i:
            p = pause_scene if s['scene'] != segments[i - 1]['scene'] else pause
            morceaux.append(np.zeros(int(p * SR)))
            t += p
        ligne.append({'id': s['id'], 'scene': s['scene'], 'texte': s['texte'], 'debut': round(t, 3), 'fin': round(t + len(x) / SR, 3),
                      'mots': [[w, round(t + d, 3), round(t + f, 3)] for w, d, f in m]})
        morceaux.append(x)
        t += len(x) / SR
        print(f"{ligne[-1]['debut']:7.2f}  {s['id']}")
    morceaux.append(np.zeros(int(fin * SR)))
    duree = t + fin

    son = np.concatenate(morceaux)
    son = son / max(np.max(np.abs(son)), 1e-6) * 0.9
    if args.moteur == 'estimation':
        son[:] = 0
    os.makedirs(os.path.join(ICI, 'sortie'), exist_ok=True)
    with wave.open(os.path.join(ICI, 'sortie', nom + '.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((son * 32767).astype(np.int16).tobytes())
    with open(os.path.join(ICI, timeline), 'w', encoding='utf-8') as f:
        f.write(f'// Fichier produit par voix.py ({args.moteur}) : ne pas modifier à la main.\n')
        f.write('window.TIMELINE = ' + json.dumps({'duree': round(duree, 3), 'moteur': args.moteur, 'segments': ligne}, ensure_ascii=False) + ';\n')
    print(f'Durée totale : {duree:.1f} s ({args.moteur})')


main()
