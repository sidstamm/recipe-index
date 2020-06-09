<?php
/**
 * For updating stuff in the db.
 */

$POST_THINGS = json_decode(file_get_contents('php://input'), true);
if (empty($POST_THINGS)) {
  echo "FAIL";
  exit(1);
}

class RecipeDB extends SQLite3
{
 function __construct() { $this->open('recipes.sqlite3'); }
}

$db = new RecipeDB();

////////////////////////// UPDATE TAGS ONLY
ini_set('display_errors', 'On');
if (array_key_exists("recipe_tags", $_GET)) {
  if ($POST_THINGS['column'] == "tags") {
    // Make sure all the tags exist in the DB.
    $upd_tags = explode(",", $POST_THINGS['data']);

    $SQL_CHECK_TAG = "SELECT * FROM tags WHERE content = :content";
    $SQL_INSERT_TAG = "INSERT INTO tags (content) VALUES (:content)";

    $tagids = array();

    foreach($upd_tags as $upd_t) {
      $stmt = $db->prepare($SQL_CHECK_TAG);
      $stmt->bindValue(':content', $upd_t);
      $r_h = $stmt->execute();
      $result = $r_h->fetchArray(SQLITE3_ASSOC);

      if ($result) {
        $tagids[] = $result['id'];
      } else {
        //gotta add it
        $stmt = $db->prepare($SQL_INSERT_TAG);
        $stmt->bindValue(':content', $upd_t);
        $stmt->execute();

        $tagids[] = $db->lastInsertRowID();
      }
    }

    // Once we're here, all the tags are guaranteed to have IDs.  Time to make connections.
    // reset the old ones first.
    $SQL_CLEANSE_TAGS = "DELETE FROM recipe_tags WHERE recipe_id = :rid";
    $stmt = $db->prepare($SQL_CLEANSE_TAGS);
    $stmt->bindValue(':rid', $POST_THINGS['id']);
    $stmt->execute();

    $SQL_CONNECT_TAG = "INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (:rid, :tid)";
    $stmt = $db->prepare($SQL_CONNECT_TAG);
    $stmt->bindParam(':rid', $_RID, SQLITE3_INTEGER);
    $stmt->bindParam(':tid', $_TID, SQLITE3_INTEGER);

    $_RID = $POST_THINGS['id'];
    foreach($tagids as $_TID) {
      echo("trying $_TID");
      $stmt->execute();
    }

    echo("{ 'result':'success', 'recipe_id': '$_RID' }");
    exit(0);
  }
}

////////////////////// UPDATE RECIPE
if (array_key_exists("recipe", $_GET)) {
  //////// VALIDATE COLUMN
  $valid_columns = array("name", "issue", "page", "maketime");
  if (!in_array($POST_THINGS['column'], $valid_columns)) {
    echo("FAIL: column not valid");
    exit(1);
  }
  $col = $POST_THINGS['column'];
  $SQL_UPDATE_RECIPE = "UPDATE recipes SET $col=:val WHERE id=:id";

  $stmt = $db->prepare($SQL_UPDATE_RECIPE);
  $stmt->bindValue(':id', $POST_THINGS['id']);
  $stmt->bindValue(':val', $POST_THINGS['data']);
  $stmt->execute();

  $db->close();
  $recipe_id = $POST_THINGS['id'];
  echo("{ 'result':'success', 'recipe_id': '$recipe_id' }");
  exit(0);
}
echo("FAIL");
exit(1);
?>
