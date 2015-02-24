$(document).ready(function() {

  /* === Models === */

  var EditorState = Backbone.Model.extend({
    defaults: {
      wideSpacing: true,
      allCaps: true,
      repeatedLines: 6,
      mode: 'singleLine',
    },

    singleLine: function() {
      return this.get('mode') == 'singleLine';
    },

    multiLine: function() {
      return !this.singleLine();
    },

    id: 'singleton',
    localStorage: new Backbone.LocalStorage("EditorState"),
  });

  var PracticeText = Backbone.Model.extend({
    defaults: {
      lines: ['ABC'],
    },

    id: 'singleton',
    localStorage: new Backbone.LocalStorage("PracticeText"),
  });

  /* === Views === */

  var ControlsView =  Backbone.View.extend({
    /* Pass in state and el to constructor */
    initialize: function(options) {
       _.extend(this, options);
      this.$wideSpacing = this.$("#wide-spacing");
      this.$allCaps = this.$("#all-caps");
      this.$repeatedLines = this.$("#repeated-lines");
      this.$mode = this.$("#mode");
    },

    events: {
      'change #wide-spacing': 'wideSpacingChanged',
      'change #all-caps': 'allCapsChanged',
      'change #repeated-lines': 'repeatedLinesChanged',
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

    repeatedLinesChanged: function(event) {
      var val = this.$repeatedLines.val();
      this.state.save('repeatedLines', val);
    },

    modeChanged: function(event) {
      var val = this.$mode.val();
      this.state.save('mode', val);
    },

    render: function() {
      this.$wideSpacing.prop('checked', this.state.get('wideSpacing'));
      this.$allCaps.prop('checked', this.state.get('allCaps'));
      this.$repeatedLines.val(this.state.get('repeatedLines'));
      this.$repeatedLines.show(this.state.singleLine());
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

      this.$el.toggleClass("single-line-mode", this.state.singleLine());

      var mode = this.state.get('mode');
      switch(mode) {
        case 'singleLine':
          var text = lines[0];
          var repeatedLines = this.state.get('repeatedLines');
          this.$firstLine.attr('contenteditable', true);
          this.$otherLines.attr('contenteditable', false);
          this.$guidelines.each(function(line) {
            $(this).html(line < repeatedLines ? text : '');
          });

          this.showWriteHere(this.$firstLine);
          this.hideWriteHere(this.$otherLines);
          break;
        case 'multiLine':
          this.$guidelines.attr('contenteditable', true);
          this.$guidelines.each(function(line) {
            $(this).html(lines[line] || '');
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
  practiceText.fetch();

  controls.render();
  sheet.render();

});

// vim: sw=2 expandtab
