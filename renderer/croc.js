module.exports = {
    general: {
        rendererMode: true,
        root: '../',
        site: '../public',
        compiled: '../public/compiled',
        resources: '../public/d',
        include: [
            'doc.package'
        ]
    },
    type: ['js', 'wtpl'],
    bower: '/renderer/bower_components',
    apps: [
        {
            path: '/renderer/source/doc',
            include: [
                //todo научить извлекать из {{}}
                'doc.Helper',
                '/renderer/source/doc/css/public.css'
            ]
        }
    ]
};