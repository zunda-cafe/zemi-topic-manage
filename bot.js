module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // Botの準備
    if (!process.env["slacktoken"]) {
       context.res = {
            status: 400,
            body: "not set process.env.token"
        };
        context.done();
    }
    //context.log(process.env["slacktoken"]);
    var Botkit = require('botkit');
    // var os = require('os');
    var request = require('request');
    var controller = Botkit.slackbot({
        debug: true,
    });
    var myquery =
        `{
        repository(owner: "zunda-cafe", name: "zunda-cafe-doc") { 
            issues(last: 100, states: OPEN, labels: "topic") { 
                edges { 
                    node { 
                    number 
                        title 
                        url 
                        author { 
                            login 
                        } 
                        reactions(last: 100) { 
                            nodes {  
                                content 
                            } 
                        } 
                    }
                } 
            }
        }  
    }`;
    var mytoken = 'eb3ee624239f28e7f5bc24edc2d40574b7b990c0';
    var bot = controller.spawn({
        token: process.env["slacktoken"]
    }).startRTM((err, bot, payload) => {
        controller.hears(['topic-list'], 'direct_message,direct_mention,mention', function (bot, message) {
            var issues = [];
            var client = require('github-graphql-client');
            // githubに問い合わせ
            request = client({
                token: mytoken,
                query: myquery
            }, function (err, res) {
                if (err) {
                    context.log("error");
                    context.log(err);
                } else {
                    // 成功した場合
                    var resData = res.data.repository.issues.edges;
                    for (i = 0; i < resData.length; i++) {
                        var issue　 = {};
                        issue.number = resData[i].node.number;
                        issue.title = resData[i].node.title;
                        issue.url = resData[i].node.url;
                        issue.author = resData[i].node.author.login;
                        issue.reaction = resData[i].node.reactions.nodes.length;
                        issues.push(issue);
                    }
                    // チャットに返信
                    var result = ""
                    for (i = 0; i < issues.length; i++) {
                        var resultLine = "#" + issues[i].number + ":" + issues[i].title + " :studio_microphone: " + issues[i].author + " :+1:" + issues[i].reaction + "pt\n" +
                            "detail: " + issues[i].url + "\n\n";
                        result += resultLine;
                    }
                    bot.reply(message,{text:result,unfurl_links: true});
                }
            })
        });
    });
    
    if (req.query.name || (req.body && req.body.name)) {
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: "Hello " + (req.query.name || req.body.name)
        };
    } else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }
    context.done();
};
