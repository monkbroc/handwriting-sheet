$(document).ready(function() {

  /* === Models === */

  var EditorState = Backbone.Model.extend({
    defaults: {
      wideSpacing: true,
      allCaps: true,
      mode: 'singleLine',
    },

    localStorage: new Backbone.LocalStorage("EditorState"),
  });

  var PracticeText = Backbone.Model.extend({
    defaults: {
      lines: ['ABC'],
    },

    localStorage: new Backbone.LocalStorage("PracticeText"),
  });

  /* === Views === */

  var ControlsView =  Backbone.View.extend({
    /* Pass in state and el to constructor */
    initialize: function(options) {
       _.extend(this, options);
      this.$wideSpacing = this.$("#wide-spacing");
      this.$allCaps = this.$("#all-caps");
      this.$mode = this.$("#mode");
    },

    events: {
      'change #wide-spacing': 'wideSpacingChanged',
      'change #all-caps': 'allCapsChanged',
      'change #mode': 'modeChanged',
    },

    wideSpacingChanged: function(event) {
      var val = this.$wideSpacing.prop('checked');
      this.state.save('wideSpacing', val);
    },

    allCapsChanged: function(event) {
      var val = this.$allCaps.prop('checked');
      this.state.save('allCaps', val);
    },

    modeChanged: function(event) {
      var val = this.$mode.val();
      this.state.save('mode', val);
    },

    render: function() {
      this.$wideSpacing.prop('checked', this.state.get('wideSpacing'));
      this.$allCaps.prop('checked', this.state.get('allCaps'));
      this.$mode.val(this.state.get('mode'));

      return this;
    },
  });
  
  var SheetView = Backbone.View.extend({
    /* Pass model, state and el to constructor */
    initialize: function(options) {
       _.extend(this, options);
      _.bindAll(this, 'render');
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.state, 'change', this.render);

      this.$guidelines = this.$(".guideline");
      this.$firstLine = this.$guidelines.first();
      this.$otherLines = this.$guidelines.slice(1);
      this.$writeHere = this.$(".write-here");
    },

    events: {
      "input .guideline": "updateLine",
    },

    updateLine: function(event) {
      var $el = $(event.target);
      var lineNum = this.$guidelines.index($el);
      if(lineNum < 0) {
        console.log("Bad line number in updateLine");
        return;
      }
      var lines = _.clone(this.model.get('lines'));
      lines[lineNum] = $el.html();
      this.model.save('lines', lines);
    },

    render: function() {
      this.$el.toggleClass("all-caps", this.state.get('allCaps'));
      this.$el.toggleClass("wide-spacing", this.state.get('wideSpacing'));

      var lines = this.model.get('lines');

      var mode = this.state.get('mode');
      this.$el.toggleClass("single-line-mode", mode == 'singleLine');
      switch(mode) {
        case 'singleLine':

          this.$firstLine.attr('contenteditable', true);
          this.$otherLines.attr('contenteditable', false);
          this.$guidelines.html(lines[0]);

          this.showWriteHere(this.$firstLine);
          this.hideWriteHere(this.$otherLines);
          break;
        case 'multiLine':
          this.$guidelines.attr('contenteditable', true);
          this.$guidelines.each(function(line) {
            $(this).html(lines[line]);
          });
          this.showWriteHere(this.$guidelines);
          break;
      }
    },

    showWriteHere: function($el) {
    },

    hideWriteHere: function($el) {
    },
  });

  /* === Application start === */

  var editorState = new EditorState();
  var practiceText = new PracticeText();
  var controls = new ControlsView({
    state: editorState,
    el: $(".controls")
  });
  var sheet = new SheetView({
    state: editorState,
    model: practiceText,
    el: $(".sheet")
  });


  editorState.fetch();

  controls.render();
  sheet.render();


  /* Old */

  var Model = function Model(text) {
    this.observers = [];
    this.setAttributes({
      text: text,
      spacing: true,
      allcaps: true,
      numlines: 6,
    });
  };

  Model.prototype.setAttributes = function(data) {
    this.attributes = [];
    for(var key in data) {
      if(data.hasOwnProperty(key)) {
        this[key] = data[key];
        this.attributes.push(key);
      }
    }
  }

  Model.prototype.set = function(attribute, value) {
    this[attribute] = value;
    this.notifyObservers();
  };

  Model.prototype.notifyObservers = function() {
    for(var i = 0; i < this.observers.length; i++) {
      this.observers[i](this);
    }
  };

  Model.prototype.registerObserver = function(observer) {
    this.observers.push(observer);
  };

  var Persistence = function Persistence(model) {
    $.cookie.json = true;

    this.model = model;
    this.model.registerObserver($.proxy(this.saveModel, this));
  };

  Persistence.prototype.loadModel = function() {
    var storedData = $.cookie();
    for(var key in storedData) {
      if(storedData.hasOwnProperty(key)) {
        if(storedData[key] !== undefined) {
          this.model[key] = storedData[key];
        }
      }
    }
  };

  Persistence.prototype.saveModel = function() {
    var attr = this.model.attributes;
    for(var i = 0; i < attr.length; i++) {
      $.cookie(attr[i], this.model[attr[i]]);
    }
  };

  var ControlsViewOld = function ControlsViewOld(el, model) {
    this.model = model;

    this.$el = el;
    this.$input = el.find("[name='line-text']");
    this.$spacing = el.find("[name='wide-spacing']");
    this.$allcaps = el.find("[name='all-caps']");
    this.$numlines = el.find("[name='num-lines']");

    this.$input.on("keyup", $.proxy(this.inputChanged, this));
    this.$spacing.on("change", $.proxy(this.spacingChanged, this));
    this.$allcaps.on("change", $.proxy(this.allcapsChanged, this));
    this.$numlines.on("change", $.proxy(this.numlinesChanged, this));
  };

  ControlsViewOld.prototype.inputChanged = function() {
    var val = this.$input.val();
    this.model.set('text', val);
  };

  ControlsViewOld.prototype.spacingChanged = function() {
    var val = this.$spacing.prop('checked');
    this.model.set('spacing', val);
  };

  ControlsViewOld.prototype.allcapsChanged = function() {
    var val = this.$allcaps.prop('checked');
    this.model.set('allcaps', val);
  };

  ControlsViewOld.prototype.numlinesChanged = function() {
    var val = +this.$numlines.val();
    this.model.set('numlines', val);
  };

  ControlsViewOld.prototype.render = function() {
    this.$input.val(this.model.text);
    this.$spacing.prop('checked', this.model.spacing);
    this.$allcaps.prop('checked', this.model.allcaps);
    this.$numlines.val(this.model.numlines);
  };

  var SheetView = function SheetView(el, model) {
    this.model = model;
    this.model.registerObserver($.proxy(this.render, this));

    this.$el = el;
    this.$guidelines = el.find(".guideline");
  };

  SheetView.prototype.render = function() {
    this.$el.toggleClass("all-caps", this.model.allcaps);
    this.$el.toggleClass("wide-spacing", this.model.spacing);

    var text = this.displayText();
    var numlines = this.model.numlines;
    this.$guidelines.each(function(line) {
      $(this).html(line < numlines ? text : '');
    });
  };

  SheetView.prototype.displayText = function() {
    var text = this.model.text;
    text = text.replace(/ /g, "&nbsp;");
    return text;
  };

  // var model = new Model("ABC 123");
  //var controls = new ControlsViewOld($(".controls"), model);
  // var sheet = new SheetView($(".sheet"), model);
  // var persistence = new Persistence(model);

  // persistence.loadModel();

  //controls.render();
  //sheet.render();
});

// vim: sw=2 expandtab
