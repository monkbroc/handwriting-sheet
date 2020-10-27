$(document).ready(function() {

  /* === Models === */

  var EditorState = Backbone.Model.extend({
    defaults: {
      wideSpacing: true,
      allCaps: true,
      largeFont: true,
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
      lines: ['abc'],
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
      this.$largeFont = this.$("#large-font");
      this.$mode = this.$('input[name="mode"]');
    },

    events: {
      'change #wide-spacing': 'wideSpacingChanged',
      'change #all-caps': 'allCapsChanged',
      'change #large-font': 'largeFontChanged',
      'change [name="mode"]': 'modeChanged',
      'click #print': 'print',
    },

    wideSpacingChanged: function(event) {
      var val = this.$wideSpacing.prop('checked');
      this.state.save('wideSpacing', val);
    },

    allCapsChanged: function(event) {
      var val = this.$allCaps.prop('checked');
      this.state.save('allCaps', val);
    },
    largeFontChanged: function(event) {
      var val = this.$largeFont.prop('checked');
      this.state.save('largeFont', val);
    },

    modeChanged: function(event) {
      var val = this.$mode.filter(function(index, element) {
        return element.checked;
      }).val();
      this.state.save('mode', val);
    },

    render: function() {
      this.$wideSpacing.prop('checked', this.state.get('wideSpacing'));
      this.$allCaps.prop('checked', this.state.get('allCaps'));
      this.$largeFont.prop('checked', this.state.get('largeFont'));
      var mode = this.state.get('mode');
      this.$mode.filter(function(index, element) {
        return $(element).val() == mode;
      }).prop('checked', true);

      return this;
    },

    print: function() {
      window.print();
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
      // Events for old IE
      "keyup .guideline": "updateLine",
      "cut .guideline": "updateLine",
      "blur .guideline": "updateLine",
      "paste .guideline": "updateLine",
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
      // Analytics
      typeText();
    },

    render: function() {
      this.$el.toggleClass("all-caps", this.state.get('allCaps'));
      this.$el.toggleClass("wide-spacing", this.state.get('wideSpacing'));
      this.$el.toggleClass("large-font", this.state.get('largeFont'));

      var lines = this.model.get('lines');

      this.$el.toggleClass("single-line-mode", this.state.singleLine());

      var mode = this.state.get('mode');
      var $active = $(document.activeElement);
      switch(mode) {
        case 'singleLine':
          var text = lines[0];
          this.$firstLine.attr('contenteditable', true);
          this.$otherLines.attr('contenteditable', false);
          this.$guidelines.not($active).html(text);
          break;
        case 'multiLine':
          this.$guidelines.attr('contenteditable', true);
          this.$guidelines.each(function(line) {
            $(this).not($active).html(lines[line] || '');
          });
          break;
      }
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

  /* === Widgets === */

  $('[data-toggle="check"]').radiocheck();
  $('[data-toggle="radio"]').radiocheck();

  /* == Analytics === */
  var typeDone = false;
  var typeText = function() {
   if(!typeDone) {
      typeDone = true;
      _gaq.push(['_trackEvent', 'Sheet', 'Type']);
    }
  };
  var printDone = false;
  var afterPrint = function() {
    if(!printDone) {
      printDone = true;
      _gaq.push(['_trackEvent', 'Sheet', 'Print']);
    }
  };

  if (window.matchMedia) {
    var mediaQueryList = window.matchMedia('print');
    mediaQueryList.addListener(function(mql) {
      if (!mql.matches) {
        afterPrint();
      }
    });
  }

  window.onafterprint = afterPrint;

  /* === Translation === */
  var dictionary = {
    "Handwriting sheet": { fr: "Page d'écriture" },
    "Write on the lines below then hit": { fr: "Écrivez sur les lignes plus bas et appuyez sur" },
    "Print!": { fr: "Imprimer!" },
    "Same word on every line": { fr: "Toutes les lignes pareilles" },
    "Wide spacing between letters": { fr: "Beaucoup d'espace entre les lettres" },
    "Each line is different": { fr: "Chaque ligne différente" },
    "All caps": { fr: "Tout en majuscules" },
    "Large font": { fr: "Grosse lettres" },
    "Write here!": { fr: "Écrivez ici!" },
    "Or": { fr: "Ou" },
    "on": { fr: "sur" },
    "any": { fr: "une" },
    "other": { fr: "autre" },
    "line": { fr: "ligne" },
    "Hint: If you print in <strong>landscape</strong>, only the first <strong>3 lines</strong> will be printed with a larger font.":
    { fr: "Si vous imprimez en <strong>paysage</strong>, seulement les <strong>3 premières lignes</strong> seront imprimées en plus gros charactères." },
    "Made with": { fr: "Fait avec" },
    "love": { fr: "amour" },
    "by": { fr: "par" },
    "Font by": { fr: "Police de charactère par" },
    "This software is free and open source.": { fr: "Ce logiciel est gratuit et ouvert." }
  };

  var language = (navigator.language || 'en').substr(0, 2)
  $("s").each(function() {
    var original = $(this).html();
    var translation = dictionary[original];
    if(!translation && window.location.host != "www.julienvanier.com") {
      alert("Missing translation: " + original);
    } else {
      $(this).html(translation[language] || original);
    }
  });
});

// vim: sw=2 expandtab
