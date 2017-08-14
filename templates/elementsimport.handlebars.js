let tpl = `
<h2>Import json file to '<a href="/mirrorjson/{{selectedDomain}}">{{selectedDomain}}</a>'</h2>
<p>
    <form method="POST" action="/mirrorjson/{{selectedDomain}}/import">
        <label>File:</label>
        <input type="file" name="jsonfile" value="" accept=".json" />
        <input type="submit" value="Import from json file" />
    </form>
</p>
`;

let headerTpl = require('../templates/header.handlebars');
let footerTpl = require('../templates/footer.handlebars');
exports.tpl = () => headerTpl.tpl() + tpl + footerTpl.tpl();
