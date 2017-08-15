let tpl = `
<h2>{{selectedDomain}}</h2>

<ul>
    {{#results}}
        <li>
            <a href="/mirrorjson/{{../selectedDomain}}/{{hash}}">{{hash}}</a>
            =>
            {{json}}
        </li>
    {{/results}}
</ul>

<form method="POST" action="/mirrorjson/{{selectedDomain}}">
    <input type="submit" name="export" value="Export listed documents" />
</form>
<form method="GET" action="/mirrorjson/{{selectedDomain}}/import">
    <input type="submit" value="Import documents from json file" />
</form>

<h2>Add a json string manually for specified path on '{{selectedDomain}}'</h2>
<form method="POST" action="/mirrorjson/{{selectedDomain}}">
    <p>Existing data for the path will be overwritten.</p>
    <label>Path:</label>
    <input type="text" name="path" value="/" />
    <br />
    <label>Json:</label>
     <textarea name="jsondata" rows="10" cols="80"></textarea>
     <br />
    <input type="submit" value="Save element" />
</form>
`;

let headerTpl = require('../templates/header.handlebars');
let footerTpl = require('../templates/footer.handlebars');
exports.tpl = () => headerTpl.tpl() + tpl + footerTpl.tpl();
