---
sidebar_position: 2
---

# Specification

## Tagging

* Each picture can have tags associated with a specific tag group.
* A tag group can have the following properties:
  * **Multiplicity**: Defines whether a picture can have multiple tags from the group (multiple) or just one (single).
  * **Default Value**: A default tag assigned to new pictures.
  * **Requirement**: Indicates if the tag is mandatory (requires a default value).

* Tags can be automatically generated by the `TaggingService` using AI-based methods, including:
  * Object recognition
  * Face recognition
  * Type or style classification


## Arrangements

* Arrangements define how pictures are organized into groups.
* Each arrangement includes a **filter** that determines which pictures it contains, based on:
  * Tags
  * EXIF data
  * Picture author
  * Deletion status
  * Shared status
  * Presence in groups of other arrangements

* An arrangement also includes a **grouping strategy** to specify how pictures are grouped, using:
  * Tags
  * EXIF data
  * Picture author
  * Deletion status
  * Shared status

* Arrangements may support **Strong Match Conversion**:
  * If enabled, the app can adjust picture attributes to match the group's criteria when adding files to a group's directory through FileServer.
  * Restrictions for Strong Match Conversion:
    * The arrangement must not filter or group solely by pictures shared with the user.
    * It must not filter or group based on non-editable EXIF data (e.g., picture width, height, orientation).
    * Group presence filters are allowed if the referenced group supports Strong Match Conversion.
  * A warning will be shown when filtering or grouping by EXIF data, author, or deletion status, as this may alter important properties.
  * Only tag conversions and limited EXIF, author, and deletion status changes are permitted.

* Groups can support **Share Match Conversion**:
  * Enables "Add Pictures" and "Share Back" permissions when sharing groups.
  * Applies only to groups that accept pictures shared with the user, do not include only the user's own pictures, and do not filter in only deleted pictures.
  * Only tag modifications are allowed during Share Match Conversion.


## Hierarchies / Architectures

* A **hierarchy** consists of multiple arrangements that map the app's grouping and tagging system to a file system structure.
* Hierarchies are accessible within the app and can also be used by the FileServer for file serving and synchronization.
* Each arrangement in a hierarchy references its **parent group ID** in the database.
* Arrangements within a hierarchy must filter images to include only those contained in the parent group.
* A hierarchy supports **match conversion** only if all of its arrangements support match conversion.

## Sharing

* Users can share a group with other users.
  * Shared pictures appear in the recipient's "shared with me" virtual arrangement, behaving as if they are the recipient's own.
* A shared group can include pictures from other users. For example, if User A shares a group with User B, User B can add those pictures to a different group he owns and shares it further.
* A "shared with me" group can be linked to an owned group that supports **Share Match Conversion**, allowing tags to be automatically added. This link is configured when a group is received through the share-back feature.

### Permissions
* A shared group can have specific permissions:
  * Add pictures
  * Share back
  * Edit EXIF data
  * Edit pictures
  * Delete pictures
* The **Add pictures** and **Share back** features are allowed only if the shared group supports **Share Match Conversion**.

### Add Pictures and Share Back
* **Add pictures** allows users to copy a picture to another user's storage, creating a physical copy rather than a synced share. The original sharer can delete the copied picture because it will be converted and shared back using **Share Match Conversion**.
* If **Share back** is allowed, the recipient of the shared group can link it to another group they own, creating a new shared group with the following characteristics:
  * Automatically accepted by the original sharer.
  * Match conversion is applied to ensure consistency between the original and shared groups.

### Copying Groups and Pictures
* Users can copy a shared group to gain full access to the pictures. This uses more storage space. The group sharing instance is marked as "copied."
  * Sync can be enabled for new pictures, but managing synchronization and linking for copied pictures involves complex logic (e.g., using a `copied_pictures` table to track original and copied pictures and sync status).
* Copied pictures can be shared like regular pictures, but recipients can choose to ignore them to avoid duplicates.

### Sharing via Link
* Users can share a group via a link for users without an account or when the account email/name is unknown.
  * Shared link instances can be converted into a standard shared group, but without an account, only the "Add pictures" feature is available.

### Data Handling
* The author ID is stored in the picture metadata but can be modified.
* A "copied" boolean field tracks whether a picture has been copied.
* The app checks picture availability for a user by joining the following tables:
  * `users` -> `shared_groups` ON `id` -> `user_id`
  * `shared_groups` -> `groups` ON `group_id` -> `id`
  * `groups` -> `groups_pictures` ON `id` -> `group_id`
  * `groups_pictures` -> `pictures` ON `picture_id` -> `id`

## Duplicates / Similar Pictures

* Archypix provides tools to manage and group similar pictures efficiently.
* Users can define a set of pictures as duplicates.
* Two database tables manage duplicates:
  * `duplicate_groups` — stores information about each group of duplicates.
  * `duplicates` — stores the specific pictures marked as duplicates within a group.
* Each duplicate group is associated with a user, but it can be viewed by others if they are marked as friends.
* In the viewer, duplicates can be displayed as a stack, with the highest-rated picture shown as the group's thumbnail.
* Users can choose to ignore duplicates, displaying only the highest-rated picture. This filter can be commonly applied to groups.

## Ratings

* A `ratings` table links each picture to a user and associates a rating between 1 and 5.
* Ratings are visible to friends.
* The `ratings` table includes a `copied_from` field that indicates whether the rating was copied from another user or if it is an original rating.

## Friendship

* A table links users who are friends.
* Friends can:
  * View each other’s ratings on shared pictures.
  * Copy ratings from friends as their own.
  * View each other’s duplicates (this is an optional view setting).
  * Share groups directly with each other, bypassing the usual share confirmation process.

## Syncing

The default Hierarchy FileServer utilizes the HierarchyService to manage files in accordance with the defined hierarchy:

* Files are accessible in the app as they are organized within the hierarchy.

* When adding, deleting, or renaming a directory:
  * Changes will be ignored (and reversed during the next sync) if the arrangement does not support "Strong Match Conversion." This feature allows for automatic tagging, as well as creating, deleting, and renaming groups on demand, typically available with custom or tag-based groups.
  * If Strong Match Conversion is not supported, an error will be raised and the user will be notified through the sync app, web app, or via email if other notifications are unavailable.

* When adding, moving, renaming, or deleting a picture:
  * If Strong Match Conversion is available:
    * Adding or moving a picture will use match conversion to adjust the picture's attributes.
    * Renaming a picture is only possible if the name is defined as custom within the group.
    * Deleting a picture will either remove it from the system or permanently delete it if configured in the hierarchy/FileServer, or if the group is set to filter deleted pictures.
  * If Strong Match Conversion is not available:
    * Adding or moving a picture will not be permitted, and an error will be raised.

* When errors occur, no changes will be applied on the server, leading to the cancellation of the action during the next sync.

## Editing

* Batch editing allows the following actions on a group of pictures:
  * Edit the picture itself:
    * Crop
    * Adjust brightness, contrast, tint, etc.
    * Change format (e.g., JPG, PNG)
    * Resize
    * Edit EXIF data:
      * Correct missing location based on averaging
      * Modify data in bulk
    * Update rating, tags, author, etc.

* The original name of pictures within a group, arrangement, or hierarchy can be automatically set according to the naming conventions of that group, arrangement, or hierarchy.

## Viewing

* **Batch View:**
  * Grid view with fixed aspect ratio
  * Grid view with variable aspect ratio

* **Single View:**
  * Carousel view
  * Slideshow view (Diaporama)

# Selection Path Syntax

Pictures visible in the batch view can be selected using the UI or by typing a selection path. The selection path format is:

`selector_type:selector_group=selector_name`

* **Examples:**
  * Select group screenshots inside the picture_type arrangement: `group:picture_types=screenshots`
  * Select some groups of the picture_type arrangement: `group:picture_types=(a, b, c)`
  * Select an arrangement: `arrangement:picture_types`
  * Select arrangements: `arrangement:(a, b, c)` (all pictures visible and grouped)

* **Available Selector Types:**
  * `group`: `<arrangement.s_name>=<group_name>`
  * `arrangement`: `<arrangement.s_name>`
  * `tag`: `<tag_group>=<tag.s_name>` (OR operator)
  * `tag_group`: `<tag.s_group>` (matches any tag in the group)
  * `exif`: `<exif_key>=<exif_value.s>`
  * `author`: `<author name>`

If a selector is used multiple times, an AND operator is applied. Group selectors use more complex conditions defined in the grouping strategy and cannot be directly translated into casual selectors.