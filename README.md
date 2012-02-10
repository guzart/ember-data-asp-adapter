Ember Data Adapter for ASP.NET MVC
==================================

This on is tailored for peoply who follow the conventions of the language they are programming.

This adapter has **TWO** main features.

    1. Uses default ASP.NET MVC routes
    1. Support JS model naming conventions

Default MVC Urls
----------------

Since ASP.NET MVC does not support (by default) PUT and DELETE http methods, the default request go to

findAll => GET  => /images
find    => GET  => /images/details/5
create  => POST => /images/create
update  => POST => /images/edit/5
delete  => POST => /images/delete/5

Support for JS Naming
---------------------

In javascript the name of the propeties in a model start with a upper case, but in javascript the start 
with a lower case letter.

`var myImage = { id:3, name:'hello', description: 'world' };`
`class MyImage { int ImageId { get; set; } string Name { get; set; } string Description { get; set; } }`

This adapter allows you to name your Ember Data models with lowercases and it will automatically uppercase
the first letter so that it matches your model properties on the server side.

**JavaScript**

      G.Image = DS.Model.extend({
        primaryKey: 'imageId',
        name: DS.attr('string'),
        description: DS.attr('string')
      });

**Controller**

      public ActionResult Details(int id) {
        var image = repository.GetImage(id);
        // you should probably put the mapping in a helper.
        // the mapping also helps you having different models in your client and server side, just like
        // a view model
        return Json(new { 
                  imageId = image.ImageId, name = image.Name, 
                  description = image.Description });
      }

      public ActionResult Edit(int id) {
        var image = repository.GetImage(id);
        UpdateModel(image, new[] { "Name", "Description" });
        repository.SaveChanges();
        return Json(new { image });
      }


It's based on the RESTAdapter that comes with Ember Data.