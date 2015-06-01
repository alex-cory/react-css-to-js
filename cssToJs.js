var fs = require('fs');
var path = require('path');
var fileToConvert = path.basename(process.argv[2]);
var file = fs.readFileSync(fileToConvert, 'utf8');
var css = require('css');
var ast = css.parse(file);
convertCssToJs(ast, fileToConvert);

// REFERENCE: http://iamdustan.com/reworkcss_ast_explorer/
// CSS LIBRARY: https://github.com/reworkcss/css
// REACT-CSS: https://www.npmjs.com/package/react-css
// REACT-STYL: https://www.npmjs.com/package/react-styl


/**
 * Converts a CSS class/id grouping to a JSX compatible grouping.
 * @param  Object rule 	        Contains unconverted selectors, attributes, etc.
 * @return Object convertedRule Contains an object of the converted rule.
 */
function convertRule(rule) {

  if (rule.type === 'rule') {

    var convertedRule = {
      //convert the selector (i.e. .selector#id ▶ selector id)
      selector: convertSelector(rule.selectors),
      //convert the attributes (i.e.  background-color: #ffff; ▶ backgroundColor: '#ffff',)
      attributes: convertAttributes(rule.declarations)
    };
  }

  return convertedRule;
}


/**
 * Converts the attributes into a JSX compatible format.
 * @param  Array attributes 	     The declaration objects and the
 *                             	     values for each CSS selector.
 * @return Array convertedAttributes The converted declaration Objects.
 */
function convertAttributes(attributes) {

  var convertedAttributes = [];

    attributes.forEach(function (attribute) {

      var property = attribute.property; // ex: background-color
      var value = attribute.value;       // ex: lightgrey
      var convertedAttr = {
        property: '',
        value: ''
      };

      //if the property and the value exist  (keeps the key value pair together)
      if (attribute.property && attribute.value) {
        convertedAttr.property = stripMinusToCamel(attribute.property);
        convertedAttr.value = convertAttrValue(attribute.value);
      }

      convertedAttributes.push(convertedAttr);
    });

  //console.log(convertedAttributes);
  return convertedAttributes;
}


function convertAttrValue(value) {
  if (value) {
    if (value.indexOf('#') !== -1 || value.indexOf('%') !== -1) {
      //surround it in single quotes
      value = "'" + value + "'";

    //if has pattern /word-word/  OR      contains (
    } else if (value.match(/\w-\w/g) || value.indexOf('(') !== -1) {

      //strip the - and camel case it
      value = stripMinusToCamel(value);

      //remove the px
      value = value.replace(/\b(\d+)[p][x]\b/g, '$1');

      //rap it in single quotes
      value = "'" + value + "'";

    } else if (value.indexOf('px') !== -1) {

      //remove the px
      value = value.replace(/\b(\d+)[p][x]\b/g, '$1');

    //if string contains 3 or more consecutive letters
    } else if (value.match(/[a-z]{3,20}/gi)) {

      //rap it in single quotes
      value = "'" + value + "'";
    }
  }

  return value;
}


/**
 * Converts a property to camel casing.
 * @param  String property The CSS property to be converted.
 * @return String          The converted CSS string property.
 */
function stripMinusToCamel(attrProperty) {

  //if property contains a -
  if (attrProperty.indexOf('-') !== -1 /*&& isNotInParens(attrProperty)*/) {

    //strip the - and uppercase the letter after it  (check regex here: http://www.regexr.com/3b43v)
    return attrProperty.replace(/-([a-z])/g, function(v) { return v[1].toUpperCase(); });

  } else {

    return attrProperty;

  }
}


/**
 * Converts the css selector to a JSX compatible selector.
 * @param  Array selector [description]
 * @return {[type]}       [description]
 */
function convertSelector(selector) {

  //TODO: - in brackets, - in url()
  var selectorNodes = [];

    //if there's 1 selector (i.e.  .selector#someID )
    if (selector.length === 1) {

      //removes all -'s and converts to camel
      selector = stripMinusToCamel(selector.toString());

      //remove all .'s, #'s, and spaces
      selectorNodes = selector.toString().split(/\s\.|\s|\.|\s\#|\#/).join(' ').trim(' ').split(' ');

    //if there's multiple comma seperated selectors   (i.e.  .selector#someID1, .selector#someID2, )
    } else if (selector.length > 1) {

      selector.forEach(function (multiSelectorNode) {

        //removes all -'s and converts to camel
        selector = stripMinusToCamel(selector.toString());

        //remove the .'s, #'s, and spaces
        selectorNodes = multiSelectorNode.toString().split(/\s\.|\s|\.|\s\#|\#/).join(' ').trim(' ').split(' ');

      });
    }

  return selectorNodes;
}


/**
 * Converts a `style` or rule back into usable text.
 * @param  Object convertedRule   The converted CSS selector and
 *                                it's attributes.
 * @return String convertedString The coverted CSS string.
 */
function jsStringify(convertedRule) {

  var convertedString = '';

  convertedString += '\n' + convertedRule.selector.toString() + ': {\n';
  for (var i = 0, l = convertedRule.attributes.length; i < l; i++) {
    if (i === l - 1) {
      convertedString += '  ' + convertedRule.attributes[i].property + ': ' + convertedRule.attributes[i].value + '\n';
    } else {
      convertedString += '  ' + convertedRule.attributes[i].property + ': ' + convertedRule.attributes[i].value + ',\n';
    }
  }
  convertedString += '},';

  return convertedString;
}


/**
 * Converts the CSS file into a JS file that works with React.js.
 * @param  String obj A string with the contents of the CSS file.
 */
function convertCssToJs(obj, fileWeAreConverting) {
  var rules = obj.stylesheet.rules;
  var convertedRules = [];
  var convertedCSS = '';
  var convertedFileName = fileWeAreConverting.replace(/\.[^/.]+$/, ".js"); // replace .css file extension with .js

  rules.forEach(function(rule) {

    var convertedRule = convertRule(rule);

    //if the line isn't a comment
    if (convertedRule !== undefined) {

      fs.appendFile(convertedFileName, jsStringify(convertedRule), function(err) {
        if(err) {
          return console.log(err);
        }
      });
    }
  });
  console.log("The file was saved!");
}
