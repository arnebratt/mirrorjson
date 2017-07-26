let tpl = `
<html>
    <head>
        <title>MirrorJson Admin</title>
    </head>
    <body>
        <h1>MirrorJson Admin</h1>

        <p>{{status}}</p>

        <ul>
            {{#results}}<li><a href="./{{localDomain}}">{{localDomain}}</a> <= {{remoteDomain}}</li>{{/results}}
        </ul>

        <h2>Add a new domain for {{currentDomain}}</h2>
        <p>
            <form method="GET" action=".">
                <label>Domain:</label>
                <input type="text" name="domain" value="" />
                <input type="submit" value="Save domain" />
            </form>
        </p>
        <p>
            <form method="GET" action=".">
                <input type="submit" name="remove_domain" value="Remove current domain" />
            </form>
        </p>
    </body>
</html>
`;

exports.tpl = () => tpl;
