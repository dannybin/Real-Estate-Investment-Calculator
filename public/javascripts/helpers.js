var hbs = require('hbs');

hbs.registerHelper('if_set', function(a, opts) {
    if(a == 'undefined')
        return opts.fn(this);
    else
        return opts.inverse(this);
});

hbs.registerHelper('if_true', function(a, opts) {
    if(a == 'true')
        return opts.fn(this);
    else
        return opts.inverse(this);
});