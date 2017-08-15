let tpl = `
<h2>Import json file to '<a href="/mirrorjson/{{selectedDomain}}">{{selectedDomain}}</a>'</h2>

<form method="POST" action="/mirrorjson/{{selectedDomain}}/import" enctype="multipart/form-data">
    <label>File:</label>
    <input type="file" name="jsonfile" value="" accept=".json" />
    <input type="submit" value="Import from json file" />
</form>

<p>Warning: any matching path hashes from the import will overwrite data currently in the database.</p>
`;

let headerTpl = require('../templates/header.handlebars');
let footerTpl = require('../templates/footer.handlebars');
exports.tpl = () => headerTpl.tpl() + tpl + footerTpl.tpl();
