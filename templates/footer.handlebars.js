let packageJson = require('../package.json');

let tpl = `
    <hr />
    <address>
        MirrorJson version ` + packageJson.version + `.
        Idea, design and implementation by ` + packageJson.author + `, Making Waves in 2017
        under the ` + packageJson.license + ` license.
    </address>
    </body>
</html>
`;

exports.tpl = () => tpl;
