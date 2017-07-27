let tpl = `
<html>
    <head>
        <title>MirrorJson Admin</title>
    </head>
    <body>
        <h1>MirrorJson Admin</h1>

        <p>{{status}}</p>

        <ul>
            {{#results}}
                <li>
                    <a href="http://{{localDomain}}">{{localDomain}}</a>
                    <=
                    <a href="http://{{remoteDomain}}">{{remoteDomain}}</a>
                    (<a href="./{{localDomain}}">{{#if (lookup ../countDocs this._id)}}{{lookup ../countDocs this._id}}{{else}}0{{/if}} stored elements</a>)
                </li>
            {{/results}}
        </ul>

        <h2>Add a new domain for '{{currentDomain.localDomain}}'</h2>
        <p>
            <form method="GET" action=".">
                <label>Domain:</label>
                <input type="text" name="domain" value="{{currentDomain.remoteDomain}}" />
                <input type="submit" value="Save domain" />
            </form>
        </p>
        <p>
            <form method="GET" action=".">
                <input type="submit" name="remove_domain" value="Remove current domain '{{currentDomain.remoteDomain}}'" />
            </form>
        </p>
    </body>
</html>
`;

exports.tpl = () => tpl;
