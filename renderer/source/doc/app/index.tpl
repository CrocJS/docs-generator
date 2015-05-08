<Title:>
    {{title}}
</Title:>

<Head:>
    <script>
        "use strict";
        document.documentElement.id = 'js';
    </script>

    <script src="d/js/preinit.js"></script>
</Head:>

<Body:>
    <div class="l-page">
        <widget is="doc.cmp.header.Header" title="{{_page.title}}"/>

        <widget is="doc.cmp.Page" api="{{=_page.api}}"/>
    </div>
</Body:>