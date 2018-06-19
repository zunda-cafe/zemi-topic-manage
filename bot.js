module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // Botの準備
    if (!process.env["slacktoken"] || !process.env["GITHUB_TOKEN"]) {
       context.res = {
            status: 400,
            body: "please set API token environment value."
        };
        context.done();
    }
    var Botkit = require('botkit');
    var request = require('request');
    var controller = Botkit.slackbot({
        debug: false,
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
    var githubToken = process.env["GITHUB_TOKEN"];
    var bot = controller.spawn({
        token: process.env["slacktoken"]
    }).startRTM((err, bot, payload) => {
        controller.hears(['topic-list'], 'direct_message,direct_mention,mention', function (bot, message) {
            var issues = [];
            var client = require('github-graphql-client');
            // githubに問い合わせ
            request = client({
                token: githubToken,
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
    context.done();
};