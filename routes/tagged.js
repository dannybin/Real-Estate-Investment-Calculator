var r = require('rethinkdb'),
    assert = require('assert'),
    self = this;


exports.index = function(req, res){

  r.table('news').filter(function(tag){return tag.hasFields('publish')}).orderBy(r.desc('creation_time')).run(self.connection, function(err, cursor){
    cursor.toArray(function(err, results) {
      if(err) throw err;
      else res.render('tagged', {entries: results});
    });
  });
};