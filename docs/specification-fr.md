---
sidebar_position: 3
---

# Spécifications (Français)

## Tagging

* Chaque photo peut avoir des tags associés à un groupe de tags spécifique.
* Un groupe de tags peut avoir les propriétés suivantes :
  * **Multiplicité** : Définit si une photo peut avoir plusieurs tags du groupe (multiples) ou juste un (unique).
  * **Valeur par défaut** : Un tag par défaut attribué aux nouvelles photos.
  * **Exigence** : Indique si le tag est obligatoire (nécessite une valeur par défaut).

* Les tags peuvent être générés automatiquement par le `TaggingService` en utilisant des méthodes basées sur l'IA, y compris :
  * Reconnaissance d'objets
  * Reconnaissance faciale
  * Classification par type ou style

## Agencements

* Les agencements définissent comment les photos sont organisées en groupes.
* Chaque agencement comprend un **filtre** qui détermine quelles photos il contient, en fonction de :
  * Tags
  * Données EXIF
  * Auteur de la photo
  * Statut de suppression
  * Statut de partage
  * Présence dans les groupes d'autres agencements

* Un agencement comprend également une **stratégie de regroupement** pour spécifier comment les photos sont regroupées, en utilisant :
  * Tags
  * Données EXIF
  * Auteur de la photo
  * Statut de suppression
  * Statut de partage

* Les agencements peuvent supporter la **Conversion de Correspondance Forte** :
  * Si activée, l'application peut ajuster les attributs des photos pour correspondre aux critères du groupe lors de l'ajout de fichiers dans un répertoire de groupe via le FileServer.
  * Restrictions pour la Conversion de Correspondance Forte :
    * L'agencement ne doit pas filtrer ou regrouper uniquement par photos partagées avec l'utilisateur.
    * Il ne doit pas filtrer ou regrouper en fonction de données EXIF non éditables (par exemple, largeur, hauteur, orientation de la photo).
    * Les filtres de présence de groupe sont autorisés si le groupe référencé prend en charge la Conversion de Correspondance Forte.
  * Un avertissement sera affiché lors du filtrage ou du regroupement par données EXIF, auteur ou statut de suppression, car cela peut modifier des propriétés importantes.
  * Seules les conversions de tags et des modifications limitées des données EXIF, de l'auteur et du statut de suppression sont autorisées.

* Les groupes peuvent supporter la **Conversion de Correspondance pour le Partage** :
  * Permet les autorisations "Ajouter des Photos" et "Partager en Retour" lors du partage des groupes.
  * S'applique uniquement aux groupes qui acceptent les photos partagées avec l'utilisateur, ne contiennent pas uniquement les propres photos de l'utilisateur et ne filtrent pas uniquement les photos supprimées.
  * Seules les modifications de tags sont autorisées lors de la Conversion de Correspondance pour le Partage.

## Hiérarchies / Architectures

* Une **hiérarchie** consiste en plusieurs agencements qui mappent le système de regroupement et de tagging de l'application à une structure de fichiers.
* Les hiérarchies sont accessibles dans l'application et peuvent également être utilisées par le FileServer pour la gestion des fichiers et la synchronisation.
* Chaque agencement dans une hiérarchie fait référence à son **ID de groupe parent** dans la base de données.
* Les agencements au sein d'une hiérarchie doivent filtrer les images pour inclure uniquement celles contenues dans le groupe parent.
* Une hiérarchie supporte la **conversion de correspondance** uniquement si tous ses agencements supportent la conversion de correspondance.

## Partage

* Les utilisateurs peuvent partager un groupe avec d'autres utilisateurs.
  * Les photos partagées apparaissent dans l'agencement virtuel "partagé avec moi" du destinataire, comme si elles étaient les siennes.
* Un groupe partagé peut inclure des photos d'autres utilisateurs. Par exemple, si l'Utilisateur A partage un groupe avec l'Utilisateur B, l'Utilisateur B peut ajouter ces photos à un groupe différent qu'il possède et le partager à son tour.
* Un groupe "partagé avec moi" peut être lié à un groupe possédé qui supporte la **Conversion de Correspondance pour le Partage**, permettant l'ajout automatique de tags. Ce lien est configuré lors de la réception d'un groupe via la fonctionnalité de partage en retour.

### Autorisations
* Un groupe partagé peut avoir des autorisations spécifiques :
  * Ajouter des photos
  * Partager en retour
  * Modifier les données EXIF
  * Modifier les photos
  * Supprimer des photos
* Les fonctionnalités **Ajouter des photos** et **Partager en retour** sont autorisées uniquement si le groupe partagé supporte la **Conversion de Correspondance pour le Partage**.

### Ajouter des Photos et Partager en Retour
* **Ajouter des photos** permet aux utilisateurs de copier une photo dans le stockage d'un autre utilisateur, créant une copie physique plutôt qu'un partage synchronisé. Le donneur de la photo peut ensuite supprimer la photo copiée car elle sera convertie et partagée en retour en utilisant la **Conversion de Correspondance pour le Partage**.
* Si **Partager en retour** est autorisé, le destinataire du groupe partagé peut le lier à un autre groupe qu'il possède, créant un nouveau groupe partagé avec les caractéristiques suivantes :
  * Acceptation automatique par le donneur original.
  * La conversion de correspondance est appliquée pour assurer la cohérence entre le groupe original et le groupe partagé.

### Copier des Groupes et Photos
* Les utilisateurs peuvent copier un groupe partagé pour obtenir un accès complet aux photos. Cela utilise plus d'espace de stockage. L'instance de partage de groupe est marquée comme "copiée."
  * La synchronisation peut être activée pour les nouvelles photos, mais la gestion de la synchronisation et des liens pour les photos copiées implique une logique complexe (par exemple, en utilisant une table `copied_pictures` pour suivre les photos originales et copiées et l'état de synchronisation).
* Les photos copiées peuvent être partagées comme des photos normales, mais les destinataires peuvent choisir de les ignorer pour éviter les doublons.

### Partage via Lien
* Les utilisateurs peuvent partager un groupe via un lien pour les utilisateurs sans compte ou lorsque l'email/le nom du compte est inconnu.
  * Les instances de lien partagé peuvent être converties en groupe partagé standard, mais sans compte, seule la fonctionnalité "Ajouter des photos" est disponible.

### Gestion des Données
* L'ID de l'auteur est stocké dans les métadonnées de la photo mais peut être modifié.
* Un champ booléen "copié" suit si une photo a été copiée.
* L'application vérifie la disponibilité des photos pour un utilisateur en rejoignant les tables suivantes :
  * `users` -> `shared_groups` ON `id` -> `user_id`
  * `shared_groups` -> `groups` ON `group_id` -> `id`
  * `groups` -> `groups_pictures` ON `id` -> `group_id`
  * `groups_pictures` -> `pictures` ON `picture_id` -> `id`

## Doublons / Photos Similaires

* Archypix offre des outils pour gérer et regrouper efficacement les photos similaires.
* Les utilisateurs peuvent définir un ensemble de photos comme doublons.
* Deux tables de base de données gèrent les doublons :
  * `duplicate_groups` — stocke des informations sur chaque groupe de doublons.
  * `duplicates` — stocke les photos spécifiques marquées comme doublons dans un groupe.
* Chaque groupe de doublons est associé à un utilisateur, mais peut être vu par d'autres s'ils sont amis.
* Dans le visualiseur, les doublons peuvent être affichés en pile, avec la photo la mieux notée affichée comme vignette du groupe.
* Les utilisateurs peuvent choisir d'ignorer les doublons, affichant uniquement la photo la mieux notée. Ce filtre peut être appliqué couramment aux groupes.

## Évaluations

* Une table `ratings` lie chaque photo à un utilisateur et associe une note entre 1 et 5.
* Les évaluations sont visibles pour les amis.
* La table `ratings` comprend un champ `copied_from` qui indique si l'évaluation a été copiée d'un autre utilisateur ou si elle est originale.

## Amitié

* Une table lie les utilisateurs qui sont amis.
* Les amis peuvent :
  * Voir les évaluations de chacun sur les photos partagées.
  * Copier les évaluations des amis comme les leurs.
  * Voir les doublons de chacun (c'est une option de vue).
  * Partager des groupes directement avec chacun, en contournant le processus de confirmation de partage habituel.

## Synchronisation

Le FileServer par défaut de Hiérarchie utilise le HierarchyService pour gérer les fichiers conformément à la hiérarchie définie :

* Les fichiers sont accessibles dans l'application comme ils sont organisés dans la hiérarchie.

* Lors de l'ajout, de la suppression ou du renommage d'un répertoire :
  * Les modifications seront ignorées (et inversées lors de la prochaine synchronisation) si l'agencement ne supporte pas la "Conversion de Correspondance Forte." Cette fonctionnalité permet de taguer automatiquement, ainsi que de créer, supprimer et renommer des groupes à la demande, généralement disponible avec des groupes personnalisés ou basés sur des tags.
  * Si la Conversion de Correspondance Forte n'est pas supportée, une erreur sera générée et l'utilisateur sera averti par l'application de synchronisation, l'application web ou par e-mail si d'autres notifications ne sont pas disponibles.

* Lors de l'ajout, du déplacement, du renommage ou de la suppression d'une photo :
  * Si la Conversion de Correspondance Forte est disponible :
    * L'ajout ou le déplacement d'une photo utilisera la conversion de correspondance pour ajuster les attributs de la photo.
    * Le renommage d'une photo n'est possible que si le nom est défini comme personnalisé dans le groupe.
    * La suppression d'une photo la retirera du système ou la supprimera définitivement si configuré dans la hiérarchie/FileServer, ou si le groupe est configuré pour filtrer les photos supprimées.
  * Si la Conversion de Correspondance Forte n'est pas disponible :
    * L'ajout ou le déplacement d'une photo ne sera pas permis, et une erreur sera générée.

* Lorsqu'une erreur se produit, aucune modification ne sera appliquée sur le serveur, entraînant l'annulation de l'action lors de la prochaine synchronisation.

## Édition

* L'édition en lot permet les actions suivantes sur un groupe de photos :
  * Éditer la photo elle-même :
    * Recadrer
    * Ajuster la luminosité, le contraste, la teinte, etc.
    * Changer de format (par exemple, JPG, PNG)
    * Redimensionner
    * Modifier les données EXIF :
      * Corriger les emplacements manquants par moyenne
      * Modifier les données en masse
    * Mettre à jour la note, les tags, l'auteur, etc.

* Le nom original des photos au sein d'un groupe, agencement ou hiérarchie peut être automatiquement défini en fonction des conventions de nommage de ce groupe, agencement ou hiérarchie.

## Affichage

* **Affichage en Lot :**
  * Vue en grille avec ratio fixe
  * Vue en grille avec ratio variable

* **Affichage Simple :**
  * Vue en carrousel
  * Vue en diaporama

# Syntaxe du Chemin de Sélection

Les photos visibles dans l'affichage en lot peuvent être sélectionnées en utilisant l'interface utilisateur ou en tapant un chemin de sélection. Le format du chemin de sélection est :

`selector_type:selector_group=selector_name`

* **Exemples :**
  * Sélectionner les captures d'écran du groupe de type de photo : `group:picture_types=screenshots`
  * Sélectionner certains groupes du type de photo : `group:picture_types=(a, b, c)`
  * Sélectionner un agencement : `arrangement:picture_types`
  * Sélectionner des agencements : `arrangement:(a, b, c)` (toutes les photos visibles et regroupées)

* **Types de Sélecteurs Disponibles :**
  * `group` : `<arrangement.s_name>=<group_name>`
  * `arrangement` : `<arrangement.s_name>`
  * `tag` : `<tag_group>=<tag.s_name>` (opérateur OU)
  * `tag_group` : `<tag.s_group>` (correspond à tout tag dans le groupe)
  * `exif` : `<exif_key>=<exif_value.s>`
  * `author` : `<author name>`

Si un sélecteur est utilisé plusieurs fois, un opérateur ET est appliqué. Les sélecteurs de groupe utilisent des conditions plus complexes définies dans la stratégie de regroupement et ne peuvent pas être directement traduits en sélecteurs courants.
