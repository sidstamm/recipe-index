<?php
/**
 * For adding stuff to the db.
 */

$POST_THINGS = json_decode(file_get_contents('php://input'), true);
if (empty($POST_THINGS)) {
  echo "FAIL";
  exit(1);
}

//first, get the type of thing (git param)
//second, do it.

class RecipeDB extends SQLite3
{
 function __construct() { $this->open('recipes.sqlite3'); }
}

$db = new RecipeDB();

/////////////////////// ADD TAG
if (array_key_exists( "tag", $_GET)) {
  $SQL_INSERT_TAG = "INSERT INTO tags (content) VALUES (:content)";

  $stmt = $db->prepare($SQL_INSERT_TAG);
  $stmt->bindValue(':content', $POST_THINGS['tag']);
  $stmt->execute();
  $db->close();
  exit(0);
}
////////////////////// ADD ISSUE
if (array_key_exists("issue", $_GET)) {
  $SQL_INSERT_ISSUE = "INSERT INTO issues (num,description) VALUES (:num, :description)";

  $stmt = $db->prepare($SQL_INSERT_ISSUE);
  $stmt->bindValue(':num', $POST_THINGS['num']);
  $stmt->bindValue(':description', $POST_THINGS['description']);
  $stmt->execute();
  $db->close();
  exit(0);
}

////////////////////// ADD RECIPE
if (array_key_exists("recipe", $_GET)) {
  $SQL_INSERT_RECIPE = "INSERT INTO recipes (name,issue,page,maketime) "
                     . "VALUES (:name, :issue, :page, :maketime)";

  $stmt = $db->prepare($SQL_INSERT_RECIPE);
  $stmt->bindValue(':name', $POST_THINGS['recipe']);
  $stmt->bindValue(':issue', $POST_THINGS['issue']);
  $stmt->bindValue(':page', $POST_THINGS['page']);
  $stmt->bindValue(':maketime', $POST_THINGS['maketime']);
  $stmt->execute();

  $recipe_id = $db->lastInsertRowID();
  //TODO: look for valid entry (success)

  // also need to add the tags!
  foreach ($POST_THINGS['tags'] as $tag_id) {
    $stmt = $db->prepare("INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (:rid, :tid)");
    $stmt->bindValue(':rid', $recipe_id);
    $stmt->bindValue(':tid', $tag_id);
    $stmt->execute();
  }

  $db->close();
  echo("{ 'recipe_id': '$recipe_id' }");
  exit(0);
}
echo("FAIL");
exit(1);
?>
