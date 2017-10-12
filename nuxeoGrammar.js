/**
 * This is the grammar we use to generate the parser nuxeoGrammar.js.
 * We use the online tool at http://pegjs.org/online to write the parser.
 */

{
  function addUniqueElements(array1, array2) {
    if (array2) {
      for (let i = 0; i < array2.length; i++) {
        if (array1.indexOf(array2[i]) === -1) {
          array1.push(array2[i]);
        }
      }
    }
    return array1;
  }

  function flattenArray(array) {
    var newArray = [];
    for (let i = 0; i < array.length; i ++) {
      if (!array[i].length) {
        newArray.push(array[i]);
      } else {
        for (let j = 0; j < array[i].length; j++) {
          newArray.push(array[i][j]);
        }
      }
    }
    return newArray;
  }

  function addCardinalityToRelationships(cardinality, relationships) {
    if (!relationships) {
      return;
    }
    for (let i = 0; i < relationships.length; i++) {
      relationships[i].cardinality = cardinality;
    }
  }

  function addToApplicationDecl(passedApplicationDecl, key, value) {
    let applicationDecl = passedApplicationDecl || {};
    applicationDecl[key] = value;
    return applicationDecl;
  }

  const parsed = {
    applications: [],
    constants: {},
    imports: {},
    schemas: [],
    documents: []
  };
}

start = p:prog {
    p.applications.reverse();
    return p;
  }

prog
  = SPACE* constantDecl:constantDecl SPACE* p:prog {
    parsed.constants[constantDecl.name] = constantDecl.value;
    return parsed;
  }

  / SPACE* importDecl:importDecl SPACE* p:prog {
    parsed.imports[importDecl.name] = importDecl;
    return parsed;
  }
  / SPACE* documentDeclaration:documentDecl SPACE* p:prog {
    parsed.documents.push(documentDeclaration);
    return parsed; 
  }
  / SPACE * schemaDecl:schemaDecl SPACE* p:prog {
    parsed.schemas.push(schemaDecl);    
    return parsed;
  }  
  / '' { return parsed; }


booleanChoice
  = TRUE { return true; }
  / FALSE { return false; }

constantDecl
  = name:CONSTANT_NAME SPACE* '=' SPACE* value:INTEGER { return { name: name, value: value }; }
  
//Imports
importDecl
 = IMPORT SPACE* s:SCHEMA_NAME SPACE* 'as' SPACE* p:SCHEMA_PREFIX {
   return addUniqueElements({name: s, prefix: p}, parsed.imports)
 }
 
 
//Entities
schemaDecl
  = doc:comment? SPACE* SCHEMA SPACE* s:SCHEMA_NAME SPACE* 'with'? SPACE* 'prefix'? SPACE* prefix:SCHEMA_PREFIX? SPACE* sb:schemaBody SPACE*  {
    return { name: s, prefix:prefix, fields: sb, doc: doc };
  }

schemaBody
  = '{' SPACE* fdl:fieldDeclList SPACE* '}' { return fdl; }
  / '' { return []; }

fieldDeclList
  = SPACE* com:comment? SPACE* f:FIELD_NAME SPACE_WITHOUT_NEWLINE* t:type SPACE_WITHOUT_NEWLINE* com2:comment? SPACE_WITHOUT_NEWLINE* ','? SPACE* fdl:fieldDeclList {
    return addUniqueElements([{ name: f, type: t, doc: com || com2 }], fdl );
  }
  / '' { return []; }
documentDecl
  = doc:comment? SPACE* DOCUMENT SPACE* d:DOCUMENT_NAME SPACE* db:documentBody SPACE* {
  return { name:d, schemas:db};
  }

documentBody
  = '{' SPACE* schemas:schemaDeclList SPACE* '}' { return schemas }
  / '' { return []; }
  
  
schemaDeclList
 = SPACE* com:comment? SPACE* s:SCHEMA_NAME SPACE* sb:schemaBody? SPACE_WITHOUT_NEWLINE* ','? SPACE* sdl:schemaDeclList {
   return addUniqueElements([{ schema:s, definition:sb }],sdl);
 }
  
type = head:[A-Z]tail:[A-z0-9]* { return `${head}${tail.join('')}`; }


// Comments
comment = commentStart notAComment:notAComment* commentStop { return notAComment.join(''); }
commentStart = '/*' [*]*
commentStop = [*]+ '/'
// a completely ignored comment, will not be a Javadoc comment
notAComment = !commentStop !commentStart char:. { return char; }

// Constants

TRUE = 'true'
FALSE = 'false'

IMPORT = 'import'
SCHEMA = 'schema'
DOCUMENT = 'document'
RELATIONSHIP = 'relationship'


REGEX = pattern:[^\n\r/]* { return pattern.join(''); }

ENUMNAME = head:[A-Z]tail:[A-z0-9]* { return `${head}${tail.join('')}`; }
ENUMPROP = underscore:[_]*head:[A-Z0-9]tail:[A-Z0-9_]* {
    return `${underscore.join('')}${head}${tail.join('')}`;
  }
CONSTANT_NAME = name:[A-Z_]+ { return name.join(''); }
INTEGER = negative:'-'?int:[0-9]+ { return parseInt(`${(negative ? negative : '') + int.join('')}`, 10); }
INJECTED_FIELD_NAME = head:[a-zA-Z]tail:[A-z0-9()]* { return `${head}${tail.join('')}`; }
FIELD_NAME = head:[a-zA-Z]tail:[A-z0-9]* { return `${head}${tail.join('')}`; }
SCHEMA_NAME = head:[a-zA-Z]tail:[A-z0-9]* { return `${head}${tail.join('')}`; }
SCHEMA_PREFIX = head:[a-zA-Z]tail:[A-z0-9]* { return `${head}${tail.join('')}`; }
DOCUMENT_NAME = head:[a-zA-Z]tail:[A-z0-9]* { return `${head}${tail.join('')}`; }
SPACE = ['\n'|'\t'|'\r'|' '|\u2028|\u2029]
SPACE_WITHOUT_NEWLINE = ['\t'|' '|\u2028|\u2029]
FORWARD_SLASH = [/]