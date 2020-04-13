<?php
  header("Content-Type: application/json; charset=utf-8");

 // TODO: read parameters to determine what to query.  Default now is list of all recipes with tag lists for each.
 class RecipeDB extends SQLite3
 {
   function __construct() { $this->open('recipes.sqlite3'); }
 }

 $db = new RecipeDB();

 $SQL_GET_RECIPES = "SELECT recipes.*,issues.description as issue_desc FROM recipes,issues "
                  . "WHERE issues.num=recipes.issue";

 $SQL_GET_RECIPE_TAGS = "SELECT tags.content FROM tags,recipe_tags "
                        . "WHERE tags.id=recipe_tags.tag_id AND recipe_tags.recipe_id=:id";

 $SQL_GET_ISSUES = "SELECT * FROM issues ORDER BY num";

 $SQL_GET_TAGS = "SELECT * FROM tags ORDER BY content"
?>

{
  "recipes":
<?
  $recipes = [];
  $result = $db->query($SQL_GET_RECIPES);
  while($res = $result->fetchArray(SQLITE3_ASSOC)) {
    if(!isset($res['id'])) continue;

    $tag_stmt = $db->prepare($SQL_GET_RECIPE_TAGS);
    $tag_stmt->bindValue(':id', $res['id']);
    $tags_r = $tag_stmt->execute();

    $tags = [];
    while($t_res = $tags_r->fetchArray(SQLITE3_ASSOC)) { $tags[] = $t_res["content"]; }

    $recipes[] = array( "id"   => $res["id"],
                        "name" => $res["name"],
                        "issue_num" => $res["issue"],
                        "issue" => $res["issue_desc"] . " (" . $res["issue"] . ")",
                        "page" => $res["page"],
                        "maketime" => $res["maketime"],
                        "tags" => $tags );
  }
  echo json_encode($recipes);
?>,

  "issues":
<?
  $issues = [];
  $result = $db->query($SQL_GET_ISSUES);
  while($res = $result->fetchArray(SQLITE3_ASSOC)) { $issues[] = $res; }
  echo json_encode($issues);
?>,

  "tags":
<?
  $tags = [];
  $result = $db->query($SQL_GET_TAGS);
  while($res = $result->fetchArray(SQLITE3_ASSOC)) { $tags[] = $res; }
  echo json_encode($tags);

  // DONE!
  $db->close();
?>

}
