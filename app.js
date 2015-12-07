/**
 * Created by lukemackenzie on 03/12/2015.
 */

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '123',
    database : 'kommunity',
    //debug: true,
    multipleStatements: true
});

var akismet = require('akismet').client({ blog: 'xxx', apiKey: 'xxx' });

var selectPosts = "SELECT p.topic_id as id, poster_ip, t.subject as message, p.poster FROM topics  t\
                  LEFT JOIN posts p on t.first_post_id = p.id WHERE poster_ip != ''";

akismet.verifyKey(function(err, verified) {
    if(err) throw err;
    if (verified) {

        console.log('API key successfully verified.');
    }

    else {

        console.log('Unable to verify API key.');
    }

});

connection.connect();

connection.query(selectPosts, function(err, rows, fields) {
    if (err) throw err;

    rows.forEach( function(entry) {

        akismet.checkSpam({
            user_ip: entry['poster_ip'],
            comment_author: entry['poster'],
            comment_content: entry['message']

        }, function(err, spam){
            if (err) throw err;
            if (spam) {
                //console.log('spam');
                afterCheck(err, entry);

            } else {

                console.log('Not spam');

            }

        });

    });

});

var afterDelete = function (err, result) {

    if (err) throw err;
    console.log('deleted ' + result.affectedRows + ' rows');


}

var afterCheck = function(err, entry) {

    if (err) throw err;

    var deleteQuery = "DELETE t, p FROM topics AS t LEFT JOIN posts AS p ON t.id = p.topic_id WHERE t.id=";
    var deleteUser = 'DELETE FROM users WHERE username='+entry.poster;
        console.log(deleteQuery + entry.id);
        console.log('entry is ' + entry['id']);
        connection.query(deleteQuery + entry.id, function(err,result)
        {
            afterDelete(err,result);
        });

        connection.query(deleteUser + entry.id, afterDelete);
        console.log('this happens after the query');


}

connection.end();