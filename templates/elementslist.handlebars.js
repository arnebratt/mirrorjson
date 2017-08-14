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

<h2>Add a json string manually for specified path on '{{selectedDomain}}'</h2>
<p>
    <form method="GET" action="/mirrorjson/{{selectedDomain}}">
        <label>Path:</label>
        <input type="text" name="path" value="/" />
        <br />
        <label>Json:</label>
         <textarea name="jsondata" rows="10" cols="80"></textarea>
         <br />
        <input type="submit" value="Save element" />
    </form>
</p>
`;

let headerTpl = require('../templates/header.handlebars');
let footerTpl = require('../templates/footer.handlebars');
exports.tpl = () => headerTpl.tpl() + tpl + footerTpl.tpl();
