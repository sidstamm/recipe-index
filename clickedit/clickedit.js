
'use strict';
var clickedit = (function () {

  /**
   * This is an HTML element that self-attaches to a TD when inserted into the dom.
   */
  class TDEditor extends HTMLElement {
    constructor() {
      self = super();
      // make shadow DOM, put text stuff in it.
      const shadow = this.attachShadow({mode: 'open'});
    }

    // happens when it's added to the DOM
    connectedCallback() {
      //console.log('TDEditor connected to ' + this.parentNode);
      let td = this.parentNode;
      td.setAttribute('editing', 'true');
    }

    __getDimensions() {
      let res = {'x':0, 'y':0, 'width':0, 'height':0};

      //find the correct location
      let elt = this.parentNode;
      while (elt != null) try {
        res.x += elt.offsetLeft;
        res.y += elt.offsetTop;
        elt = elt.offsetParent;
      } catch (err) { elt = null; }

      res.width = this.parentNode.offsetWidth; // TODO: incorporate padding and borders.
      res.height = this.parentNode.offsetHeight;

      return res;
    }

    /**
     * Callback used when everything worked and the editor should go away
     * (updating the table element).
     *
     * @param value - the text content to put back in the table cell
     */
    __finalizeUpdate(value) {
      //console.log("PARENT: FINALIZE");
      this.parentNode.removeAttribute('editing');     // exit editing
      this.parentNode.textContent = value; // copy out text/remove editor
      //e.target.removeChild(evt.target); // already done above
    }

    /**
     * Callback used when something failed and the editor should go away
     * (not changing the table element).
     */
    __abortUpdate() {
      this.parentNode.removeAttribute('editing');     // exit editing
      this.parentNode.removeChild(this); // already done above
    }

    /**
     * Callback that is triggered when the editor is "blurred", or loses focus.
     */
    __blurHandler(evt) {
      //TODO: make it so you can save too.
      this.__abortUpdate();
    }

    /*
     * Sends an update post to the callback url
     */
    __postUpdate(value, url) {
      return new Promise( (resolve,reject) => {
        let dataname = this.hasAttribute('dataname') ?
                       this.getAttribute('dataname') : 'data';
        let params = this.hasAttribute('editpayload') ?
                     JSON.parse(this.getAttribute('editpayload')) : {};
        params[dataname] = value;
        fetch(url, { method: "POST", body: JSON.stringify(params) })
        .then( res => {
          if(res.status == 200)  resolve(res);
          else                   reject(res);
        });
      });
    }
  }


  class TDDropDownEditor extends TDEditor {

    constructor() {
      self = super();
      let inp = document.createElement('select');
      this.shadowRoot.appendChild(inp);
    }

    connectedCallback() {
      super.connectedCallback();

      let td = this.parentNode;
      let sel = this.shadowRoot.querySelector('select');
      sel.classList.add('clickedit_dropdown');
      sel.style.position = "absolute";

      //copy text attributes from text it's replacing so it looks pretty
      sel.style.fontFamily = window.getComputedStyle(td).fontFamily;
      sel.style.fontSize = window.getComputedStyle(td).fontSize;

      let dims = super.__getDimensions();

      sel.style.left = dims.x;
      sel.style.top = dims.y;
      sel.style.width = dims.width; // TODO: incorporate padding and borders.
      //sel.style.height = dims.height;

      let sel_id = this.hasAttribute('selected_id') ?
                   this.getAttribute('selected_id') :
                   null;

      let options;

      if(this.hasAttribute('optionsListName') &&
         (this.getAttribute('optionsListName') in window.clickedit.optionsLists)) {
        options = window.clickedit.optionsLists[this.getAttribute('optionsListName')];
      } else if(this.hasAttribute('options')) {
        options = JSON.parse(this.getAttribute('options'));
      } else {
        console.log("NO OPTIONS LIST AVAILABLE for TDDropDownEditor");
        console.log(this);
        return;
      }

      let opt;
      for(let key in options) {
        opt = document.createElement('option');
        opt.setAttribute('value', key);
        opt.textContent = options[key];
        if (key == sel_id) {
          opt.selected = true;
        }
        sel.appendChild(opt);
      }
      sel.setAttribute('size', ""+Math.min(Object.keys(options).length, 4));

      sel.addEventListener('blur', this.__blurHandler.bind(this), true);
      sel.addEventListener('keydown', this.__keyHandler.bind(this), true);
      //TODO: make it so a click "saves" just like keydown/Enter.

      sel.focus();
    }

    __finalizeUpdate(value, id) {
      //console.log("DROPDOWN: FINALIZE");
      this.parentNode.setAttribute('selected_id', id);
      super.__finalizeUpdate(value);
    }

    __keyHandler(evt) {
      if (evt.defaultPrevented) return;
      switch(evt.code) {
        case "Escape":
          this.__abortUpdate();
          break;
        case "Enter":
        case "Tab":
          let selected_value = evt.target.selectedOptions[0].value;
          let selected_text = evt.target.selectedOptions[0].textContent;

          if (this.hasAttribute('editUrl')) {
            let url = this.getAttribute('editUrl');
            this.__postUpdate(selected_value, url)
            .then((res) => this.__finalizeUpdate(selected_text, selected_value))
            .catch((res) => {
              // abort
              console.log(`Error posting change to ${url}.`);
              console.log(res);
              this.__abortUpdate();
            });
          }
          else {
            // No post: just update the HTML element.
            this.__finalizeUpdate(selected_text, selected_value);
          }
          break;
        default:
          return;
      }
      evt.preventDefault(); // avoid double-handling
    }

  }

  class TDTextEditor extends TDEditor {
    constructor() {
      self = super();
      let inp = document.createElement('input');
      this.shadowRoot.appendChild(inp);
    }

    connectedCallback() {
      super.connectedCallback();

      let td = this.parentNode;
      let e = this.shadowRoot.querySelector('input');
      //target.appendChild(this.editor);
      e.classList.add('clickedit_field');
      e.style.position = "absolute";

      //copy text attributes from text it's replacing so it looks pretty
      e.style.fontFamily = window.getComputedStyle(td).fontFamily;
      e.style.fontSize = window.getComputedStyle(td).fontSize;

      let dims = super.__getDimensions();

      e.style.left = dims.x;
      e.style.top = dims.y;
      e.style.width = dims.width; // TODO: incorporate padding and borders.
      e.style.height = dims.height;

      e.addEventListener('blur', this.__blurHandler.bind(this), true);

      //attach a keystroke listener for enter/tab/esc
      e.addEventListener('keydown', this.__keyHandler.bind(this), true);

      // grab the editable text
      e.value = td.textContent;
      e.select();
      e.focus();
    }

    __keyHandler(evt) {
      if (evt.defaultPrevented) return;
      switch(evt.code) {
        case "Escape":
          this.__abortUpdate();
          break;

        case "Enter":
        case "Tab":
          let value = evt.target.value;
          if (this.hasAttribute('editUrl')) {
            let url = this.getAttribute('editUrl');
            this.__postUpdate(evt.target.value, url)
                .then((res) => this.__finalizeUpdate(value))
                .catch((res) => {
                  console.log(`Error posting change to ${url}.`);
                  console.log(res);
                  this.__abortUpdate(res);
                });
          } else {
            // no URL to hit, just finish.
            this.__finalizeUpdate(evt.target.value);
          }
          break;
        default:
          return;
      }
      evt.preventDefault(); // avoid double-handling
    }

  }

  //window.customElements.define('td-editor-input', TDEditor, { extends: 'input' });
  window.customElements.define('td-editor-input', TDEditor);
  window.customElements.define('td-text-editor-input', TDTextEditor);
  window.customElements.define('td-dropdown-editor-input', TDDropDownEditor);


  function _setup() {
    // install listeners
    let tbls = document.querySelectorAll('table');
    for(let tb of tbls) {
      //console.log("attaching...");
      tb.addEventListener('click', (e) => {
          if (e.target.nodeName == "TD" &&
              e.target.hasAttribute('canedit') &&
              !e.target.hasAttribute('editing')) {
            // https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
            //let ed = document.createElement('input', { is : 'td-editor-input' });

            let ed;
            switch(e.target.getAttribute('canedit')) {
              case "text":
                ed = document.createElement('td-text-editor-input');

                //copy in callback attributes
                for (let attr of ['editUrl', 'editpayload', 'dataname']) {
                  if (e.target.hasAttribute(attr)) {
                    ed.setAttribute(attr, e.target.getAttribute(attr));
                  }
                }
                e.target.appendChild(ed);
                break;

              case "dropdown":
                ed = document.createElement('td-dropdown-editor-input');
                //copy in callback attributes
                for (let attr of ['editUrl', 'editpayload', 'dataname',
                                  'options', 'optionsListName', 'selected_id']) {
                  if (e.target.hasAttribute(attr)) {
                    ed.setAttribute(attr, e.target.getAttribute(attr));
                  }
                }
                e.target.appendChild(ed);
                break;

              default:
                console.log("NOT YET IMPLEMENTED");
                break;
            }
      }});

      //TODO: support more types of inputs based on attributes.
    }
  }
  window.addEventListener('load', _setup);

  // expose these to the HTML document
  return {
    'optionsLists': {}
  };

})();
