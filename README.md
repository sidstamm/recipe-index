# Recipe Index project
This is a basic web-interface to a simple sqlite3 database to provide searchable index for magazine recipes.

## Needle in a Haystack
Over many years, our subscription has generated a heap of magazines that contain recipes -- only some of which we use.  The Post-It-Note-As-Bookmark system only works so well, and we often find ourselves yearning for a card catalog when there are nearly 100 magazines to search for a simple recipe. That's what this attempts to solve.

## Magnet for extracting the Needle
Sort the magazines in chronological order on the shelf.  Enter desired recipes into this database.  Search the database when you want a recipe, and it will tell you exactly which magazine to pull off the shelf.

## Extra Features
For fun, this project has a few features that make it a bit more usable.

1. Recipes are listed in a sort-capable table.
1. You can search for recipes by name or tag (use the search box)
1. Many recipe fields can be edited easily right in the display table
1. Adding a recipe has a pretty blur-the-background overlay UI.
1. The nerdy author used this as an excuse to learn a bit about Promises and WebComponents.

# Installation
You'll need a web server with PHP and sqlite3 capabilities (which should [be default in modern PHP installs](https://www.php.net/manual/en/sqlite3.installation.php)).

Clone this repo where you want to use it, then copy `recipes_blank.sqlite3` to `recipes.sqlite3`.  Then access index.php in a web browser (via your PHP/apache/nginx/whatever server) and start adding things.

# Gallery

Adding a recipe:
<img style="border:1px solid blue;" src="https://github.com/sidstamm/recipe-index/raw/master/docs/addrecipe.jpg" alt="Adding a Recipe" title="Adding a recipe" />

Editing a recipe:
<img style="border:1px solid blue;" src="https://github.com/sidstamm/recipe-index/raw/master/docs/editrecipe.jpg" alt="Editing a recipe" title="Editing a Recipe" />
