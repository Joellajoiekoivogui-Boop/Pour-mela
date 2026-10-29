# Fabrique la voix off et la ligne de temps d'une présentation.
#
#   ElevenLabs (clé dans la variable ELEVENLABS_API_KEY) :
#     python3 voix.py --texte texte-2min.json --moteur elevenlabs
#   Piper (voix locale, gratuite) :
#     python3 voix.py --texte texte.json --moteur piper --modele fr_FR-tom-medium.onnx
#
# Lit le texte (segments), fait prononcer chaque segment, puis écrit :
#   sortie/<nom>.wav : toute la narration, pauses comprises
#   <timeline>.js    : le début et la fin de chaque segment, lus par la page
#                      HTML pour caler les animations
#
# Pour remplacer la voix de synthèse par la tienne, enregistre un segment
# dans voix-perso/<id>.wav (l'id est dans le fichier de texte) : il sera
# pris à la place, et toute l'animation se recalera dessus.
import argparse
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
    # enlève les silences au début et à la fin du segment
    i = np.where(np.abs(x) > seuil)[0]
    if not len(i):
        return x
    return x[max(0, i[0] - 400): i[-1] + 2000]


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
        return lire_wav(tampon)


class ElevenLabs:
    def __init__(self):
        from elevenlabs import VoiceSettings
        from elevenlabs.client import ElevenLabs as Client
        cle = os.environ.get('ELEVENLABS_API_KEY')
        if not cle:
            raise SystemExit('Variable ELEVENLABS_API_KEY absente : ajoute ta clé ElevenLabs dans les réglages de l’environnement.')
        self.client = Client(api_key=cle)
        self.voix = os.environ.get('ELEVENLABS_VOICE_ID', VOIX_ELEVENLABS)
        self.reglages = VoiceSettings(stability=0.5, similarity_boost=0.8, style=0.25, use_speaker_boost=True)
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
        fichier = os.path.join(self.cache, f"{seg['id']}-{cle}.mp3")
        if not os.path.exists(fichier):  # chaque segment n'est payé qu'une fois
            morceaux = self.client.text_to_speech.convert(
                voice_id=self.voix, model_id=MODELE_ELEVENLABS, text=texte, output_format='mp3_44100_128',
                voice_settings=self.reglages, previous_text=avant or None, next_text=apres or None)
            with open(fichier, 'wb') as f:
                for m in morceaux:
                    f.write(m)
        with open(fichier, 'rb') as f:
            return decoder_mp3(f.read())


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--texte', default='texte.json')
    a.add_argument('--moteur', choices=['piper', 'elevenlabs'], default='piper')
    a.add_argument('--modele', help='modèle .onnx de Piper')
    args = a.parse_args()

    donnees = json.load(open(os.path.join(ICI, args.texte), encoding='utf-8'))
    segments, reglages = donnees['segments'], donnees.get('reglages', {})
    debut, pause, pause_scene, fin = (reglages.get(k, v) for k, v in
                                      [('debut', 2.0), ('pause', 0.45), ('pause_scene', 1.6), ('fin', 7.0)])
    nom = os.path.splitext(args.texte)[0].replace('texte', 'voix')       # texte-2min.json → voix-2min
    timeline = os.path.splitext(args.texte)[0].replace('texte', 'timeline') + '.js'
    moteur = ElevenLabs() if args.moteur == 'elevenlabs' else Piper(args.modele, reglages.get('vitesse_piper', 1.08))

    # 1. faire dire chaque segment
    audios = []
    for i, s in enumerate(segments):
        perso = os.path.join(ICI, 'voix-perso', s['id'] + '.wav')
        if os.path.exists(perso):
            x = lire_wav(perso)
        else:
            avant = ' '.join(x['texte'] for x in segments[max(0, i - 2):i])
            apres = segments[i + 1]['texte'] if i + 1 < len(segments) else ''
            x = moteur.dire(s, avant, apres)
        audios.append(rogner(x))

    # 2. si une durée cible est donnée, allonger ou raccourcir les pauses entre
    #    scènes (entre 0,3 et 2,5 s) pour l'atteindre
    coupures = sum(1 for i in range(1, len(segments)) if segments[i]['scene'] != segments[i - 1]['scene'])
    parole = sum(len(x) for x in audios) / SR
    if reglages.get('duree_cible') and coupures:
        reste = reglages['duree_cible'] - (debut + parole + pause * (len(segments) - 1 - coupures) + fin)
        pause_scene = min(2.5, max(0.3, reste / coupures))

    # 3. assembler la narration et la ligne de temps
    morceaux, ligne, t = [np.zeros(int(debut * SR))], [], debut
    for i, (s, x) in enumerate(zip(segments, audios)):
        if i:
            p = pause_scene if s['scene'] != segments[i - 1]['scene'] else pause
            morceaux.append(np.zeros(int(p * SR)))
            t += p
        ligne.append({'id': s['id'], 'scene': s['scene'], 'texte': s['texte'], 'debut': round(t, 3), 'fin': round(t + len(x) / SR, 3)})
        morceaux.append(x)
        t += len(x) / SR
        print(f"{ligne[-1]['debut']:7.2f}  {s['id']}")
    morceaux.append(np.zeros(int(fin * SR)))
    duree = t + fin

    son = np.concatenate(morceaux)
    son = son / np.max(np.abs(son)) * 0.9
    os.makedirs(os.path.join(ICI, 'sortie'), exist_ok=True)
    with wave.open(os.path.join(ICI, 'sortie', nom + '.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((son * 32767).astype(np.int16).tobytes())
    with open(os.path.join(ICI, timeline), 'w', encoding='utf-8') as f:
        f.write(f'// Fichier produit par voix.py ({args.moteur}) : ne pas modifier à la main.\n')
        f.write('window.TIMELINE = ' + json.dumps({'duree': round(duree, 3), 'moteur': args.moteur, 'segments': ligne}, ensure_ascii=False, indent=1) + ';\n')
    print(f'Durée totale : {duree:.1f} s ({args.moteur})')


main()
