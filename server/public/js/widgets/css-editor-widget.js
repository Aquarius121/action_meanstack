/*
   link(rel='stylesheet', href='/stylesheets/codemirror/codemirror.css')
   link(rel='stylesheet', href='/stylesheets/codemirror/show-hint.css')
   script(src="/js/tpl/codemirror/codemirror.min.js")
   script(src="/js/tpl/codemirror/show-hint.js")
   script(src="/js/tpl/codemirror/codemirror-mode-css.min.js")
   script(src="/js/tpl/codemirror/css-hint.js")
 */
var css_editor_widget = (function() {

    CodeMirror.commands.autocomplete = function(cm) {
        CodeMirror.showHint(cm, CodeMirror.hint.css);
    };

    function init(container, css) {
        return CodeMirror(container[0], {
            mode: 'css',
            lineNumbers: true,
            extraKeys: {"Ctrl-Space": "autocomplete"},
            value: css && css.length > 0 ? css : ""
        });
    }

    return {
        init: init
    }
}());
