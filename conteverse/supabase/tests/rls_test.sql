-- Tests des politiques RLS (voir README, section « Tester les migrations »). Base de test uniquement.
\set ON_ERROR_STOP 0
insert into auth.users (id, email) values
 ('00000000-0000-0000-0000-00000000000a','a@x'), ('00000000-0000-0000-0000-00000000000b','b@x'),
 ('00000000-0000-0000-0000-0000000000ad','admin@x'), ('00000000-0000-0000-0000-0000000000ed','ed@x'), ('00000000-0000-0000-0000-0000000000a0','parent@x');
insert into user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000ad','admin'), ('00000000-0000-0000-0000-0000000000ed','editeur');
select 'profils créés par trigger', count(*) from profiles;

-- 1. Anonyme
set role anon; select set_config('request.jwt.claim.sub','',false);
select 'anon lit articles publiés', count(*) from articles;
insert into articles (slug,title,category_id,difficulty,age_min,age_max,reading_minutes,content_type,intro) select 'pirate','x',id,'facile',7,9,1,'fiche','x' from categories limit 1;
reset role;
update articles set status='brouillon' where slug='mont-nimba';
set role anon; select 'anon ne voit pas le brouillon', count(*) from articles where slug='mont-nimba'; reset role;

-- 2. Utilisateur A
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
insert into country_discoveries (user_id, country_code) values ('00000000-0000-0000-0000-00000000000a','GN');
insert into reading_history (user_id, article_slug, completed) values ('00000000-0000-0000-0000-00000000000a','fonio-cereale', true);
insert into user_progress (user_id, item_type, item_slug, score, total) values ('00000000-0000-0000-0000-00000000000a','quiz','quiz-guinee',4,5);
select 'A attendu ERREUR : écrire pour B'; insert into country_discoveries (user_id, country_code) values ('00000000-0000-0000-0000-00000000000b','GN');
select 'A attendu ERREUR : devenir admin'; insert into user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000a','admin');
select 'A : nb de lignes modifiées sur article (attendu 0)'; update articles set title='hack' where slug='fonio-cereale';
select 'A voit ses profils (attendu 1)', count(*) from profiles;
select 'A voit le brouillon ? (attendu 0)', count(*) from articles where slug='mont-nimba';
update profiles set pseudo='Awa' where id='00000000-0000-0000-0000-00000000000a';
reset role;

-- 3. Utilisateur B ne voit pas la progression de A
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
select 'B voit progression A (attendu 0)', (select count(*) from country_discoveries) + (select count(*) from user_progress) + (select count(*) from reading_history);
reset role;

-- 4. Éditeur
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000ed',false);
select 'éditeur voit le brouillon (attendu 1)', count(*) from articles where slug='mont-nimba';
update articles set status='publie' where slug='mont-nimba';
select 'éditeur attendu ERREUR : changer un rôle'; insert into user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000b','admin');
select 'éditeur : suppression article (attendu 0 ligne)'; delete from articles where slug='fonio-cereale';
reset role;
select 'article republié', status from articles where slug='mont-nimba';

-- 5. Admin crée un lien parental ; le parent lit la progression de A
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000ad',false);
insert into parental_accounts (guardian_id, child_id) values ('00000000-0000-0000-0000-0000000000a0','00000000-0000-0000-0000-00000000000a');
insert into user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000b','editeur');
select 'admin lit les journaux', count(*) from moderation_logs;
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a0',false);
select 'parent lit progression enfant (attendu 3)', (select count(*) from country_discoveries) + (select count(*) from user_progress) + (select count(*) from reading_history);
select 'parent lit pseudo enfant', pseudo from profiles where id='00000000-0000-0000-0000-00000000000a';
select 'parent attendu 0 : modifier progression enfant'; update user_progress set score=0;
select 'parent attendu ERREUR : se lier à B'; insert into parental_accounts (guardian_id, child_id) values ('00000000-0000-0000-0000-0000000000a0','00000000-0000-0000-0000-00000000000b');
reset role;
