/**
 * TagInput HTML Input element.
 *
 * Allows construction of <tag-input> elements with tokenization and autocomplete-suggestions.
 * 
 * This example HTML document includes a single tag editor input, prepopulates
 * the input with a couple of tags, and enables autocomplete suggestion.
 *
 * When the element loses focus (blur), a comma-separated list of tags is sent
 * to the console as a kind of "callback".
 *
 * 
 * <html>
 *   <head>
 *     <script src="taginput.js" type="text/javascript"></script>
 *     <script>
 *       taginput.ALL_TAGS = ['one', 'two', 'tree', 'alfa', 'bravo', 'charlie'];
 *       taginput.SUGGEST = true;
 *     </script>
 *   </head>
 *   <body>
 *     <tag-input id="test-editor-one"
 *                prepopulate="one,two"
 *                onblur="console.log('TAGS: ' + this.value)"></tag-input>
 *   </body>
 * </html>
 *
 * Version History:
 *
 * Version 1.0 - 9 June 2020
 *   - initial version
 *
 * Author: Sid Stamm <sidstamm@gmail.com>
 */

'use strict';
var taginput = (function() {

  var TAGINPUT_SETTINGS = {
    'suggest': false,
    'ALL_TAGS': [],
    'debug': false,
  };

  function DEBUG(...args) {
    if(TAGINPUT_SETTINGS.debug) {
      console.log("[TagInput] DEBUG >>", ...args);
    }
  }

  const TAGINPUT_STYLES = `
    .taginput {
      flex-wrap:wrap;
      align-content:flex-start;
      display:flex;
      flex-wrap: wrap;
      max-width:100%;
      border: 1px solid black;
      padding: 2px;
      font-family:inherit;
      font-size:inherit;
    }

    /** INPUT BOX THINGS **/
    div#taginput-input-wrapper {
      flex-grow: 1;
      height: 1.7em;
      line-height: 1.7em;
      overflow: hidden;
      order: 1000;
      margin: 0;
      padding: 0;
      position:relative;
      display:flex;
    }

    #taginput-input-wrapper input#taginput-input {
      width:100%;
      display:inline-block;
      border:none;
      font-size:inherit;
      font-family:inherit;
      padding: 1px;
      height: 1.7em;
      line-height: 1.7em;
    }

    input#taginput-input:focus {
      outline:none;
    }

    #taginput-input-wrapper div#taginput-suggest {
      color: #ddd;
      position: absolute;
      font-size:inherit;
      font-family:inherit;
      top: 0;
      left: 1px;
      overflow: hidden;
      border:none;
      height: 1.7em;
      line-height: 1.7em;
    }

    /** The tags **/
    .taginput div.taginput-tag {
      display: flex;
      flex-grow: 0;
      position: relative;
      overflow: hidden;
      border: 1px solid #777;
      border-radius: 3px;
      background-color: #eee;
      padding: 0px 0.2em 0 0.2em;
      margin: 0.2em 0.1em 0 0.1em;
      height: 1.3em;
      cursor:pointer;
    }

    /* For remove button */
    .taginput .taginput-tag .taginput-remove {
      display: inline-block;
      background-color: rgba(255,0,0,0.5);
      color: #fff;
      border-top-right-radius: 3px;
      border-bottom-right-radius: 3px;
      height: 1.3em;
      margin-left: 3px;
      position: absolute;
      right: -20px;
      width: 20px;
      text-align: center;
      cursor:pointer;
    }

    .taginput-tag:hover .taginput-remove {
      right: 0;
    }
  `;

  /**
   * This is an HTML element that can be used to find/suggest, add, and remove tags.
   */
  class TagInput extends HTMLElement {
    constructor() {
      self = super();
      const shadow = this.attachShadow({mode: 'open'});

      this.tags = []
      DEBUG("settings: ", TAGINPUT_SETTINGS);
      DEBUG("test");
    }

    // getter for the tags
    get value() {
      return this.tags.join(",");
    }

    //take focus
    focus() {
      this.shadowRoot.querySelector("#taginput-input").focus();
    }

    /*
     * This function executes when the element is attached to the DOM.
     *
     * It creates the 
     */
    connectedCallback() {
 
      // this could be done programmatically, but this is a nice way to show
      // the structure inside the custom HTML elements.
      let template = "<style>" + TAGINPUT_STYLES + "</style>" +
      `
      <div class="taginput">
        <!-- tags will go here -->
        <div id="taginput-input-wrapper">
          <input type="text" id="taginput-input">
          <div id="taginput-suggest"></div>
        </div>
      </div>
      `;
      this.shadowRoot.innerHTML = template;

      // pre-populate if the attribute is present
      if (this.hasAttribute('prepopulate')) {
        this.tags = this.getAttribute('prepopulate').split(',');
        DEBUG("pre-populating", this.tags);
        this.__drawTags();
      }

      // attach keyboard listeners to input box
      let inp_elt = this.shadowRoot.querySelector("#taginput-input");
      inp_elt.addEventListener('keydown', this.__keydown.bind(this));
      inp_elt.addEventListener('keyup', this.__trySuggest.bind(this));

      // if we lose focus, need to save any tags
      inp_elt.addEventListener('blur', (evt) => {
        let val = inp_elt.value;
        if (val.length > 0) {
          this.__addTag(val);
          this.shadowRoot.querySelector("#taginput-input").value = "";
          this.shadowRoot.querySelector("#taginput-suggest").innerText = "";
          this.__drawTags();
        }
      });
    }

    /**
     * Adds a tag to this element -- unless it is a duplicate.
     */
    __addTag(tag) {
      if (!this.tags.includes(tag)) {
        this.tags.push(tag);
        DEBUG("added tag", tag);
      }
    }

    /**
     * Removes a tag from this element if it exists.
     */
    __removeTag(tag) {
      this.tags = this.tags.filter( i => i !== tag );
      DEBUG("removed tags matching " + tag);
    }

    /**
     * Constructs HTML elements for the tags (divs) and adds them
     * to the flex layout.
     */
    __drawTags() {
      let tgs = this.shadowRoot.querySelectorAll('.taginput-tag');
      let container = this.shadowRoot.querySelector('.taginput');

      // clear all tags
      for (let t of tgs) { container.removeChild(t); }

      // add tags back
      for (let t of this.tags) {
        let telt = document.createElement('div');
        telt.classList.add('taginput-tag');
        telt.innerHTML = t;

        // construct remove box
        let x = document.createElement('div');
        x.classList.add('taginput-remove');
        x.innerHTML = 'x';
        telt.appendChild(x);
        x.addEventListener('click', (evt) => {
          this.__removeTag(t);
          this.__drawTags();
        });
        container.appendChild(telt);
      }
    }

    /**
     * Executes when something is typed in the input box.
     */
    __keydown(evt) {
      let val = this.shadowRoot.querySelector("#taginput-input").value;
      let sug = this.shadowRoot.querySelector("#taginput-suggest").getAttribute("value");

      // special case: if there's no pending suggestion or value, allow
      // tab-escape to next input element in the tab sequence.
      if (val.length < 1 && evt.code == 'Tab') { return; }

      switch(evt.code) {
        case 'Enter':
        case 'Tab':
          // take suggestion
          if(val.length > 0 && sug != null && sug.length > 0) {
            val = sug;
          }
          // no break here, want to add the tag too

        case 'Comma':
        case 'Space':
          // only add tags that have content
          if (val.length > 0) {
            this.__addTag(val);
            this.shadowRoot.querySelector("#taginput-input").value = "";
            this.shadowRoot.querySelector("#taginput-suggest").innerText = "";
            this.__drawTags();
          }
          evt.preventDefault(); // don't allow typing of space or comma
          break;
        default:
          break;
      }
    }

    /**
     * Attempts to make a suggestion.  This happens on key-up because we want
     * it to suggest immediately after the text input value changes.
     */
    __trySuggest(evt) {

      if (!TAGINPUT_SETTINGS.suggest) { return; }

      let k = evt.key;
      let val = this.shadowRoot.querySelector("#taginput-input").value;

      let suggest = this.shadowRoot.querySelector("#taginput-suggest");
      suggest.innerHTML = "";
      suggest.setAttribute("value", "");

      if (val.length > 0) {
        // attempt suggest
        let matches = TAGINPUT_SETTINGS.ALL_TAGS.filter(i => i.startsWith(val));

        if (matches.length > 0) {
          // store match in value attribute for easy retrieval later
          suggest.setAttribute("value", matches[0]);

          // skip over previously typed data
          let s = document.createElement('span');
          s.style['visibility'] = "hidden";
          s.textContent = val;
          suggest.appendChild(s);
          s = document.createElement('span');
          s.textContent = matches[0].substr(val.length);
          suggest.appendChild(s);
        }
      }
    }
  }

  // register the custom element
  window.customElements.define('tag-input', TagInput);

  // public tools: allows setting the global "suggestions" list, and enabling/disabling suggestions.
  return {
    set ALL_TAGS(arr) { TAGINPUT_SETTINGS.ALL_TAGS = arr; TAGINPUT_SETTINGS.ALL_TAGS.sort(); },
    get ALL_TAGS()    { return TAGINPUT_SETTINGS.ALL_TAGS; },

    set SUGGEST(val) { TAGINPUT_SETTINGS.suggest = val; },
    get SUGGEST() { return TAGINPUT_SETTINGS.suggest; },
  };

})();
