/*
 * datalist.js
 *
 * Provides sorting/filtering/managing a list of data.
 *
 * Author: Sid Stamm <sid@sidstamm.com>
 */


var datalist = (function(window, document) {

  function _installDataLists() {
    // Installs into all tables with class "datalist"
    let elts = document.querySelectorAll('table.datalist');

    for(let e of elts) {
      //console.log("Installing into " + e.id);

      if(e.classList.contains('sortable')) {
        _installSorting(e);
      }

      if(e.classList.contains('filterable')) {
        _installFiltering(e);
      }

      //TODO: attach event listeners for editing
      if(e.classList.contains('editable')) {
        _installEditing(e);
      }
    }
  }

  /**
   * Sorts the rows of a table body by a given index.
   *
   * This uses the HTML attribute 'sortKey' in the TD elements
   * to determine sort order.  If that attribute is not present,
   * it uses the textContent for sorting.
   *
   * @param tbody - the HTML tbody element containing rows
   * @param byIndex - the index of the column to use for sorting
   * @param ascending - if true, will sort in ascending order
   */
  function __sortTbody(tbody, byIndex, ascending) {
    let sortFunc = function(a, b) {
      // Sort as number unless the key is not a number
      let ak = a.childNodes.item(byIndex).hasAttribute('sortKey') ?
               a.childNodes.item(byIndex).getAttribute('sortKey') :
               a.childNodes.item(byIndex).textContent;
      let bk = b.childNodes.item(byIndex).hasAttribute('sortKey') ?
               b.childNodes.item(byIndex).getAttribute('sortKey') :
               b.childNodes.item(byIndex).textContent;
      if (!isNaN(ak) && !isNaN(bk)) {
        ak = (+ak);
        bk = (+bk);
      }
      return ascending ? (ak > bk) : (ak < bk);
    };

    // sort the data
    let arr = Array.from(tbody.childNodes).sort( sortFunc );
    tbody.childNodes.forEach( x => x.remove() );
    arr.forEach(x => tbody.appendChild(x));
  }

  /**
   * Installs sorting capabilities on a HTMLTable element
   */
  function _installSorting(table_elt) {
    // install a mutation event listener that fires when the table's contents change.
    const thead = table_elt.querySelector('thead');

    // listen for changes to the child list
    const config = { childList: true , subtree: true};

    const callback = function(mutationsList, observer) {
      // find the headers, and sort by that column
      let headers = table_elt.querySelectorAll('thead th');
      let tbody = table_elt.querySelector('tbody');

      for (let i = 0; i < headers.length; i++) {
        let th = headers.item(i);
        th.addEventListener('click',
          function() {
            if(th.classList.contains('sortkey')) {
              // reverse the direction if re-clicked
              if(th.classList.contains('down')) {
                th.classList.add('up');
                th.classList.remove('down');
              } else {
                th.classList.add('down');
                th.classList.remove('up');
              }
            } else {
              //transfer sort key (on first click)
              headers.forEach((h) => h.classList.remove(...['sortkey', 'up', 'down']));
              th.classList.add(...['sortkey','up']);
            }
            __sortTbody(tbody, i, th.classList.contains('up'));
          });
      }
    }

    const observer = new MutationObserver(callback);
    observer.observe(thead, config);

    // Can also stop observing
    //observer.disconnect();
  }


  function __buildFilterStuff(elt, changeCallback) {
    let fbox = document.createElement('input');
    fbox.setAttribute('type', 'text');
    fbox.classList.add('filterbox');
    fbox.setAttribute('placeholder', 'search...');
    fbox.addEventListener('input', changeCallback);
    return fbox;
  }

  /**
   * Installs filtering capabilities on a HTMLTable element
   */
  function _installFiltering(table_elt) {

    // this determines if a tr element matches the filter text
    function matches(tr, txt) {
      txt = txt.toLowerCase();
      for(let td of tr.childNodes) {
        if (td.textContent.toLowerCase().includes(txt)) { return true; }
      }
      return false;
    }

    let filter = function(e) {
      let rows = table_elt.querySelector('tbody').childNodes;

      let filtertext = e.currentTarget.value;
      //console.log('event: ' + filtertext);

      rows.forEach((tr) => tr.style.display = (matches(tr, filtertext) ? 'table-row' : 'none'));
    };

    // place the table in a container and add the filter input box
    let div = document.createElement('div');
    div.classList.add('filterTableDiv');
    let fbox = __buildFilterStuff(table_elt, filter);
    table_elt.replaceWith(div);
    div.appendChild(fbox);
    div.appendChild(table_elt);

  }


  function _installEditing(table_elt) { }


  // exposed values
  return {
    'installDataLists': _installDataLists
  };

})(window, document);
