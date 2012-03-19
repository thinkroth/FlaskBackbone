(function() {

  var TEMPLATE_URL = '/static';
  
  var Address = Backbone.Model.extend({

    defaults: function() {
      return {
        nickname: '',
        order: 0
      };
    }

  });

  var AddressList = Backbone.Collection.extend({
    model: Address,
    url: '/locations/',
    
    nextOrder: function() {
      if (!this.length) {
        return 1;
      }
        
      return this.last().get('order') + 1;
    },

    comparator: function(address) {
      return address.get('order');
    }

  });

  var AddressView = Backbone.View.extend({
    tagName:  "li",

    template: _.template($('#item-template').html()),

    events: {
      "dblclick .nickname"      : "edit",
      "click span.address-destroy" : "clear",
      "keypress .nickname-input"   : "updateOnEnter"
    },

    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    render: function() {
      var self = this;
      
      $(self.el).html(this.template(this.model.toJSON()));
      self.setText();
      return this;
    },

    setText: function() {
      var address = this.model.get('address'),
          nick = this.model.get('nickname');

      this.$('.address').text(address);
      this.$('.nickname').text(nick);

      this.input = this.$('.nickname-input');
      this.input.bind('blur', _.bind(this.close, this)).val(nick);

    },

    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },

    close: function() {
      this.model.save({nickname: this.$('.nickname-input').val()});
      $(this.el).removeClass("editing");
    },

    updateOnEnter: function(e) {
      if (e.keyCode === 13) { this.close(); }
    },

    remove: function() {
      $(this.el).remove();
    },

    clear: function() {
      this.model.destroy();
    }
  });

  window.AddressApp = Backbone.View.extend({
    addresses: new AddressList(),
    events: {
      "click #pushButton": "buttonClicked"
    },

    initialize: function(options) {
      var self = this,
          parentElt = options.appendTo || $('body');
          
      TEMPLATE_URL = options.templateUrl || TEMPLATE_URL;
      
      parentElt.template(TEMPLATE_URL + '/templates/app.html', {}, function() {
        self.el = $('#addressapp');
        self.delegateEvents();
        
        self.input = self.$("#new-address");

        self.addresses.bind('add',   self.addOne, self);
        self.addresses.bind('reset', self.addAll, self);
        self.addresses.bind('all',   self.render, self);

        self.addresses.fetch();
      });
    },

    addOne: function(address) {
      console.log('addOne');
      var view = new AddressView({model: address});
      this.$("#address-list").append(view.render().el);
    },

    addAll: function() {
      console.log('addAll');
      this.addresses.each(this.addOne);
    },

    //Gets text from forms and submits it then clears form
    buttonClicked: function() {
      var address = $('#new-address').val();
      var nickname = $('#new-nick').val();
      if (address === '' || nickname === '') {
        return;
      }
      this.addresses.create({address: address, order: this.addresses.nextOrder(), nickname: nickname});
      $('#new-address').val('');
      $('#new-nick').val('');
    }
  });
 
}());
