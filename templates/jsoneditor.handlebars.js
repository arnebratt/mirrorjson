let tpl = `
<!DOCTYPE HTML>
<html>
<head>
    <title>MirrorJson Admin</title>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8">

    <link href="/jsoneditor/dist/jsoneditor.min.css" rel="stylesheet" type="text/css">
    <script src="/jsoneditor/dist/jsoneditor.min.js"></script>
</head>
<body>
    <form id="saveform" action="/mirrorjson/{{domain}}" method="POST">
        <input type="hidden" name="hash" value="{{hash}}" />
        <input id="jsondata" type="hidden" name="jsondata" value="{{{json}}}" />
        <input id="save" type="button" name="StoreJson" value="Save Json" />
        <input id="cancel" type="button" value="Cancel changes" />
    </form>
    <div id="jsoneditor" style="width: 600px; height: 800px;"></div>

    <p><a href="https://github.com/josdejong/jsoneditor/blob/master/docs/shortcut_keys.md" target="_blank">Shortcut keys</a></p>

    <script>
        // create the editor
        var container = document.getElementById("jsoneditor");
        var options = {mode: "form", modes: ["code", "form"], onError: function (err) {alert(err.toString());}};
        var editor = new JSONEditor(container, options);

        // set json
        editor.set({{{json}}});

        function save() {
            document.getElementById('jsondata').value=JSON.stringify(editor.get());
            document.getElementById('saveform').submit();
        }
        function cancel() {
            window.location.href = "/mirrorjson/{{domain}}";
        }
        document.getElementById("save").addEventListener("click", save);
        document.getElementById("cancel").addEventListener("click", cancel);
    </script>
</body>
</html>
`;

exports.tpl = () => tpl;
