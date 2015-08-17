var mongoose = require('mongoose'),
    Article = mongoose.model('Article'),
    Image = mongoose.model('Image'),
    tags = [{
        "text": "Tag1"
    }, {
        "text": "Tag2"
    }, {
        "text": "Tag3"
    }, {
        "text": "Tag4"
    }, {
        "text": "Tag5"
    }, {
        "text": "Tag6"
    }, {
        "text": "Tag7"
    }, {
        "text": "Tag8"
    }, {
        "text": "Tag9"
    }, {
        "text": "Tag10"
    }],

    conditions = [{
        "value": "0",
        "label": "Need Fixing"
    }, {
        "value": "1",
        "label": "Need Minimun repair"
    }, {
        "value": "2",
        "label": "Ready to Use"
    }, {
        "value": "3",
        "label": "Like brand New!"
    }];


var getErrorMessage = function(err) {
    if (err.errors) {
        for (var errName in err.errors) {
            if (err.errors[errName].message) {
                return err.errors[errName].message;
            }

        }
    } else {
        return 'Unknown server error';
    }
};


exports.create = function(req, res) {
    var article = new Article(req.body);
    article.creator = req.user;
    article.save(function(err) {
        if (err) {
            return res.status(400).send({
                message: getErrorMessage(err)
            });
        } else {
            res.json(article);
        }
    });
};

exports.list = function(req, res) {
    Article.find().sort('-created').populate('creator', 'firstName lastName fullName ').exec(function(err, articles) {
        if (err) {
            return res.status(400).send({
                message: getErrorMessage(err)
            });
        } else {
            res.json(articles);
        }
    });
};


exports.listLatest = function(req, res) {

    Article.find().sort('-created').limit(5).exec(function(err, articles) {
        if (err) {
            return res.status(400).send({
                message: getErrorMessage(err)
            });
        } else {

            articles.forEach(function(article) {
                populateFirstImage(article).then(function(image) {
                    article.images.push(image);
                });
            });
            res.json(articles);
        }
    });
};

exports.listPaginated = function(req, res) {

    Article.paginate({}, {
        page: req.query.page,
        limit: req.query.limit,
        sortBy: {
            created: -1
        }
    }, function(err, articles, pageCount, itemCount) {

        if (err) {
            return res.status(400).send({
                message: getErrorMessage(err)
            });
        } else {

            articles.forEach(function(article) {

                populateFirstImage(article);

            });


            var result = {
                itemCount: itemCount,
                articles: articles
            };
            res.json(result);
        }

    });
};

exports.searchPaginated = function(req, res) {


    Article.paginate(

        {
            $text: {
                $search: req.query.text
            }
        },

        {
            page: req.query.page,
            limit: req.query.limit,

        },
        function(err, articles, pageCount, itemCount) {

            if (err) {
                return res.status(400).send({
                    message: getErrorMessage(err)
                });
            } else {


                populateFirstImages(articles).then(function() {
                    var result = {
                        itemCount: itemCount,
                        articles: articles
                    };
                    res.json(result);
                });


            }
        });
};

exports.read = function(req, res) {

    var article = req.article;

    getArticleImages(article).then(function(images) {
        article.images = images;
        res.json(article);
    }, function(err) {
        res.status(400).send({
            message: err
        });
    });


};

exports.update = function(req, res) {
    var article = req.article;
    article.title = req.body.title;
    article.content = req.body.content;
    article.save(function(err) {
        if (err) {
            return res.status(400).send({
                message: getErrorMessage(err)
            });
        } else {
            res.json(article);
        }
    });
};

exports.delete = function(req, res) {
    var article = req.article;
    article.remove(function(err) {
        if (err) {
            return res.status(400).send({
                message: getErrorMessage(err)
            });
        } else {
            res.json(article);
        }
    });
};

exports.articleByID = function(req, res, next, id) {
    Article.findById(id).populate('creator', 'firstName lastName fullName ').exec(function(err, article) {
        if (err) return next(err);
        if (!article) return next(new Error('Failed to load article ' +
            id));
        req.article = article;
        next();
    });
};

exports.hasAuthorization = function(req, res, next) {
    if (req.article.creator.id !== req.user.id) {
        return res.status(403).send({
            message: 'User is not authorized'
        });
    }
    next();
};

exports.listTags = function(req, res) {
    res.json(tags);
};

exports.listConditions = function(req, res) {
    res.json(conditions);
};


function getFirstArticleImage(article) {

    return new Promise(function(resolve, reject) {

            Image
                .findOne({
                    _article: article._id
                }, '_id')
                .sort({
                    created: -1
                })
                .exec(function(err, image) {
                    if (err) reject(Error(err));
                    resolve(image);
                });
        }

    );
}

function getArticleImages(article) {
    return new Promise(function(resolve, reject) {

            Image
                .find({
                    _article: article._id
                }, '_id')
                .sort({
                    created: -1
                })
                .exec(function(err, images) {
                    if (err) reject(Error(err));
                    resolve(images);
                });
        }

    );
}



function populateFirstImages(articles) {

    var promises = [];

    articles.forEach(function(article) {

        promises.push(
            getFirstArticleImage(article).then(function(image) {
                article.images.push(image);
            })
        );
    });

    return Promise.all(promises);

}