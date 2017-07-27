let tpl = `
<h2>{{selectedDomain}}</h2>

<ul>
    {{#results}}
        <li>
            <a href="./{{../selectedDomain}}/{{hash}}">{{hash}}</a>
            =>
            {{json}}
        </li>
    {{/results}}
</ul>
`;

let headerTpl = require('../templates/header.handlebars');
let footerTpl = require('../templates/footer.handlebars');
exports.tpl = () => headerTpl.tpl() + tpl + footerTpl.tpl();
