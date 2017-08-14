let tpl = `
<!DOCTYPE HTML>
<html>
    <head>
        <title>MirrorJson Admin</title>
    </head>
    <body>
        <h1><a href="/mirrorjson">MirrorJson Admin</a></h1>

        <p>{{status}}</p>

`;

exports.tpl = () => tpl;
