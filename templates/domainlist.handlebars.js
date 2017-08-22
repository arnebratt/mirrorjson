let tpl = `
{{#if results}}
    <ul>
        {{#results}}
            <li>
                <a href="http://{{localDomain}}/mirrorjson">{{localDomain}}</a>
                <=
                <a href="http://{{remoteDomain}}" target="_blank">{{remoteDomain}}</a>
                (<a href="/mirrorjson/{{localDomain}}">view {{#if (lookup ../countDocs this._id)}}{{lookup ../countDocs this._id}}{{else}}0{{/if}} stored documents</a>)
            </li>
        {{/results}}
    </ul>
{{else}}
    <p>No external API registered</p>
{{/if}}

<h2>Set external API domain for '{{currentLocal}}'</h2>
<p>Be aware: Any existing documents related to '{{currentLocal}}' will be deleted when its external domain is changed.</p>
<p>
    <form method="POST" action="/mirrorjson">
        <label>Domain:</label>
        <input type="text" name="domain" value="{{currentRemote}}" />
        <input type="submit" value="Save domain" />
    </form>
</p>
{{#if currentRemote}}
    <p>
        <form method="POST" action="/mirrorjson">
            <input type="submit" name="remove_domain" value="Remove external domain '{{currentRemote}}'" />
        </form>
    </p>
{{/if}}
`;

let headerTpl = require('../templates/header.handlebars');
let footerTpl = require('../templates/footer.handlebars');
exports.tpl = () => headerTpl.tpl() + tpl + footerTpl.tpl();
