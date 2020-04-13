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

////////////////////// UPDATE RECIPE
if (array_key_exists("recipe", $_GET)) {

  // VALIDATE COLUMN
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
