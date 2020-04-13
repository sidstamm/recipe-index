<html>
<head>

<!-- blank icon -->
<link rel="icon" href="data:;base64,iVBORw0KGgo=">

<link rel="stylesheet" type="text/css" href="datalist/datalist.css">
<link rel="stylesheet" type="text/css" href="overlay.css">

<script type="text/javascript" src="clickedit/clickedit.js"></script>
<script type="text/javascript" src="datalist/datalist.js"></script>
<script type="text/javascript">

var recipe_data;

// Load the data
function getRecipeData() {
  return fetch('./getjson.php')
    .then( (response) => response.json() )
    .then( (data) => {
      window.recipe_data = data;
      populateRecipeList(data.recipes);
      return data;
    });
}

// populate the recipe list
function populateRecipeList(recipes) {
  function mkElt(kind, text, sortKey, attributes) {
      let e = document.createElement(kind);
      e.innerText = text;
      e.setAttribute('sortKey', sortKey ? sortKey : text);
      if(attributes) {
        // add any optional attributes
        for (let attr in attributes) {
          e.setAttribute(attr, attributes[attr]);
        }
      }
      return e;
  }
  let tbl = document.getElementById('tbl_recipes');

  //clear headers and body
  let thead = tbl.querySelector('thead');
  //thead.childNodes.forEach((n) => n.remove());
  thead.innerHTML = "";
  let tbody = tbl.querySelector('tbody');
  //tbody.childNodes.forEach((n) => n.remove());
  tbody.innerHTML = "";

  let row = document.createElement('tr');
  //row.appendChild(mkElt('th',"ID"));
  row.appendChild(mkElt('th',"name"));
  row.appendChild(mkElt('th',"issue"));
  row.appendChild(mkElt('th',"page"));
  row.appendChild(mkElt('th',"time"));
  row.appendChild(mkElt('th',"tags"));
  row.appendChild(mkElt('th',""));
  thead.appendChild(row);

  let issueObj = {};
  for(let x of recipe_data.issues) {
    issueObj[""+x['num']] = x['description'] + " (" + x['num'] + ")";
  }

  // store the issue list in global lists.
  window.clickedit.optionsLists['issues'] = JSON.parse(JSON.stringify(issueObj));

  for(let item of recipes) {
    let row = document.createElement('tr');
    //row.appendChild(mkElt('td',item['id']));
    row.appendChild(mkElt('td',item['name'],null,
        {'canedit':'text',
         'editUrl':'tweak.php?recipe',
         'dataname': 'data',
         'editpayload':'{"column":"name", "id":"' + item['id'] + '"}'
        }));
    row.appendChild(mkElt('td',item['issue'], item['issue_num'],
        {'canedit':'dropdown',
        /*'options':JSON.stringify(issueObj), <-- really inefficient */
         'optionsListName':'issues',
         'selected_id':item['issue_num'],
         'editUrl':'tweak.php?recipe',
         'dataname': 'data',
         'editpayload':'{"column":"issue", "id":"' + item['id'] + '"}'
        }));
    row.appendChild(mkElt('td',item['page'],null,
        {'canedit':'text',
         'editUrl':'tweak.php?recipe',
         'dataname': 'data',
         'editpayload':'{"column":"page", "id":"' + item['id'] + '"}'
        }));
    row.appendChild(mkElt('td',item['maketime'],null,
        {'canedit':'text',
         'editUrl':'tweak.php?recipe',
         'dataname': 'data',
         'editpayload':'{"column":"maketime", "id":"' + item['id'] + '"}'
        }));
    row.appendChild(mkElt('td',item['tags']));

    // removal button
    let e = document.createElement('td');
    let b = document.createElement('input');
    b.setAttribute('type', 'button');
    b.setAttribute('value', 'X');
    b.style['border-radius'] = '50%';
    b.style['border'] = '1px solid red';
    b.addEventListener('click', function() {
      if(confirm('Are you sure you want to remove "' + item['name'] + '"?')) {
        postRemoveRecipe(item['id']);
      }});
    e.appendChild(b);
    row.appendChild(e);

    tbody.appendChild(row);
  }
}

// triggers removal of a recipe
function postRemoveRecipe(id) {
  // Could prompt
  // confirm("Are you sure you want to remove this recipe?");

  fetch("./del.php?recipe", {
    method: "POST",
    body: JSON.stringify({'recipe_id': id})
  }).then( res => {
    console.log("REMOVED RECIPE: " + id);
  }).then(window.getRecipeData)
    .then((data) => refreshAddForm(data['issues'], data['tags']));
}

// reset the "add new" form.
// (for after submission)
function resetAddForm() {
    qs("recipe_name").value = "";
    // don't reset issue -- maybe sequentially adding many
    //qs("issue").selectedIndex = 0;
    qs("tags").selectedIndex = -1;
    qs("page").value = "";
    qs("maketime").value = "";
    qs("recipe_name").focus();
}

// Helper for a couple of things.
function qs(sel) {
  let x = '[name="' + sel + '"]';
  let e = null;
  if (e = document.body.querySelector("input" + x)) { return e; }
  if (e = document.body.querySelector("select" + x)) { return e; }
  console.log("Couldn't find: selector " + x);
  return null;
};


// populate the "add new" form
function refreshAddForm(issues, tags) {
  //update issues
  let iss = document.body.querySelector("#addform select[name='issue']");
  //TODO: if an issue is selected before refresh, reselect it
  while(iss.options.length > 0) { iss.remove(0); }

  issues =issues.sort((a,b) => a.num < b.num);
  for(let n of issues) {
    let e = document.createElement('option');
    e.setAttribute('value', n['num']);
    e.textContent = n['description'] + " (" + n['num'] + ")";
    iss.appendChild(e);
  }

  //update tags
  let tgs = document.body.querySelector("#addform select[name='tags']");
  //TODO: if tags are selected before refresh, reselect it
  while(tgs.options.length>0) { tgs.remove(0); }

  for(let n of tags) {
    let e = document.createElement('option');
    e.setAttribute('value', n['id']);
    e.textContent = n['content'];
    tgs.appendChild(e);
  }

}

/**
 * Submits an "add recipe" request to the server.
 */
function postAdd(frm) {
  let blob = {
    "recipe": qs("recipe_name").value,
      "issue":  qs("issue").value,
      "tags": Array.from(qs("tags").selectedOptions).map((e)=>e.value),
      "page": qs("page").value,
      "maketime": qs("maketime").value
  };
  console.log("POSTING ADD: ");
  console.log(blob);

  // then post it
  fetch("./add.php?recipe", {
    method: "POST",
    body: JSON.stringify(blob)
  }).then( res => {
    console.log("ADDED RECIPE: " + res);
  }).then( window.getRecipeData )
    .then( window.resetAddForm );
}

/**
 * Submits a new issue to the server.
 */
function postAddIssue() {
  let num = prompt("What is the issue number?");
  if(num == null) { return false; }
  let description = prompt("Describe the issue:");
  if(description == null) { return false; }

  fetch("./add.php?issue", {
    method: "POST",
    body: JSON.stringify({'num': num, 'description': description})
  }).then( res => {
    console.log("ADDED ISSUE NUMBER: " + num);
  }).then(window.getRecipeData)
    .then((data) => refreshAddForm(data['issues'], data['tags']))
    .then(() => {
      // then select what we just added
      let opt = document.querySelector("#addform select[name='issue'] > option[value='" + num + "']");
      if(opt) { opt.selected = true; }
  });
}


/**
 * Submits a new tag to the db.
 */
function postAddTag() {
  let txt = window.prompt('Enter New Tag:');
  // handle cancel case
  if(txt == null) { return false; }

  // make sure it's not already in the tag list.
  for(let o of document.querySelectorAll("select[name='tags'] > option")) {
    if (o.textContent.toLowerCase() == txt) {
      alert('tag ' + txt + ' already exists.');
      return false;
    }
  }

  let sel = document.querySelector("select[name='issue']");
  let issue_num = sel.selectedOptions[0].value;

  fetch("./add.php?tag", {
    method: "POST",
    body: JSON.stringify({'tag': txt})
  }).then( res => {
    console.log("ADDED TAG: " + txt);
  }).then( window.getRecipeData )
    .then( (data) => window.refreshAddForm(data['issues'], data['tags']) )
    .then( () => {
      //reselect the issue
      let opt = document.querySelector("#addform select[name='issue'] > option[value='" + issue_num + "']");
      if(opt) { opt.selected = true; }
  });
}


window.addEventListener("load",
  () => getRecipeData()
          .then((data) => refreshAddForm(data['issues'], data['tags'])));

window.addEventListener("load", datalist.installDataLists);

</script>


</head>
<body>


<div id="div_addform" class="overlay_card" hidden>
<div style="float:right;">
  <button onclick="document.getElementById('recipe_list').classList.remove('background_card');document.getElementById('div_addform').setAttribute('hidden', 'true');">
    X
  </button>
</div>
<h1>Add New Recipe</h1>
<div style="border:1px solid #444; background: #eee;">
  <form id="addform" onsubmit="postAdd(this); return false;">
  <table>
  <tr>
    <td colspan="2">Recipe:</td>
    <td>Tags:
       <input type='button' value='+' onclick="postAddTag();"></td>
  </tr>
  <tr>
    <td colspan=2><input type="text" name="recipe_name" size=70 tabindex=1></input></td>
    <td rowspan=3> <select name="tags" multiple size=5 tabindex=2></select>
    </td>
  </tr>
  <tr>
    <td>Issue:</td>
    <td><select name="issue" tabindex=3> </select><input type='button' value='+' onclick="postAddIssue();"> &nbsp;
        Page: <input type="text" name="page" tabindex=4></input></td>
  </tr>
  <tr>
    <td colspan=2>Time to prepare (minutes): <input type="text" name="maketime" size="10" tabindex=5></td>
  </tr>

  <tr>
    <td colspan=3> <input type="submit" value="Add Recipe" tabindex=6></td>
  </tr>
  </table>
  </form>
</div>
</div> <!-- div_addform -->

<div id="recipe_list">
<h1>Recipe Index</h1>

  <div style="float:right;">
    <button onclick="document.getElementById('recipe_list').classList.add('background_card');document.getElementById('div_addform').removeAttribute('hidden');">add new...</button>
  </div>
<table id="tbl_recipes" class="datalist sortable filterable clickedit">
<!-- need to pre-define the thead and tbody elements -->
<thead></thead>
<tbody></tbody>
</table>
</div>




</body>
</html>
