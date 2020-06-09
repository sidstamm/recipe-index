<?php
/**
 * For removing stuff from the db.
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

#/////////////////////// ADD TAG
#if (array_key_exists( "tag", $_GET)) {
#  $SQL_INSERT_TAG = "INSERT INTO tags (content) VALUES (:content)";
#
#  $stmt = $db->prepare($SQL_INSERT_TAG);
#  $stmt->bindValue(':content', $POST_THINGS['tag']);
#  $stmt->execute();
#  exit(0);
#}
#////////////////////// ADD ISSUE
#if (array_key_exists("issue", $_GET)) {
#  $SQL_INSERT_ISSUE = "INSERT INTO issues (num,description) VALUES (:num, :description)";
#
#  $stmt = $db->prepare($SQL_INSERT_ISSUE);
#  $stmt->bindValue(':num', $POST_THINGS['num']);
#  $stmt->bindValue(':description', $POST_THINGS['description']);
#  $stmt->execute();
#  exit(0);
#}

////////////////////// REMOVE RECIPE
if (array_key_exists("recipe", $_GET)) {
  $db = new RecipeDB();

  $SQL_REMOVE_RECIPE = "DELETE FROM recipes WHERE id=:id";
  $SQL_REMOVE_TAGS = "DELETE FROM recipe_tags WHERE recipe_id=:id";


  $stmt = $db->prepare($SQL_REMOVE_TAGS);
  $stmt->bindValue(':id', $POST_THINGS['recipe_id']);
  $stmt->execute();

  $stmt = $db->prepare($SQL_REMOVE_RECIPE);
  $stmt->bindValue(':id', $POST_THINGS['recipe_id']);
  $stmt->execute();

  $db->close();

  exit(0);
}
echo("FAIL");
exit(1);
?>
