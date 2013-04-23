/*
 *  Project: jquery.bootstrap-grid-js plugin
 *  Description:
 *  Author: Gabriel Ladeira github:gabrielladeira
 *  License:
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ($, window, document, undefined) {

    var pluginName = "BootstrapGridJS";
    // Create the defaults once
    var defaults = {
		/*Div Content Css Class*/
		contentClass:'',
		
		/*Data Configurations*/
		columns: [],
		data: [],
		
		/*Initial Filter Options*/
		filterOptions: [],
		
		/*Table Css Class*/
		tableclass: 'table-striped table-hover',

		/*Search Configurations*/
		keySearch: '',
		operatorSearch: 'contains',
		contentSearchClass: 'pull-right',
		inputSearchClass: 'span2',
		allowFilter: true,

		/*Pagination Configuration*/
		currentPage: 1,
		pageSize: 10,
		paginationClass: 'pagination-centered',

		/*Sort Configuration*/
		keySort: '',
		orderSort: '',

		/*Callback Functions*/
		rowClick: function (el) {
		}
    };
	
	var OperatorTypes =
	{
		GREATER: 'greater',
		LESS: 'less',
		EQUALS: 'equals',
		GREATER_OR_EQUAL: 'greater_or_equal',
		LESS_OR_EQUAL: 'less_or_equal',
		CONTAINS: 'contains',
		STARTS_WITH: 'starts_with'
	};
	
    // The actual plugin constructor
    function Filter (element, options) {
		
		this.options = $.extend({}, defaults, options);

		this._defaults = defaults;
        this._name = pluginName;
		this.element = element;
		
		this.$el = $(element);
		
		this.$table = $('<table/>', {id: this.element.id + 'TableGridJS', name: this.element.id + 'GridJS', class: 'table'});
		
		this.$divFilter = $('<div />', { class: 'input-prepend' });

		this.$input = $('<input/>', { type: 'text', id: this.element.id + 'SearchGridJS', name: this.element.id + 'SearchGridJS', placeholder: 'Buscar', class: this.options.inputSearchClass});
		
		this.$options = $('<select />', {class: this.options.inputSearchClass});
		this.$options.append($('<option />', { text: 'Selecione', value: '' }));
		this.$options.append($('<option />', { text: 'Sim', value: 'true' }));
		this.$options.append($('<option />', { text: 'Não', value: 'false' }));

		this._data = this.options.data;

		this._firstPage = 1;

		this._totalEls = function() {
			return this._data.length;
		};
		
		this._totalPages = function() {
			if(this._totalEls() % this.options.pageSize == 0)
				return this._totalEls() / this.options.pageSize;
			else
				return parseInt(this._totalEls() / this.options.pageSize + 1);
		};

		

		this.init();
    }

    Filter.prototype = {
        
		init: function () {
			
			this.options.keySearch = this.options.columns[0].key;
			
			this.render();
			
			if(this.options.allowFilter)
				this.$el.append(this.$divFilter);	
			
			this.$el.append(this.$table);
			
			this.filter();
        },
		
		render: function () {

			this.clear();

			if(this.options.contentClass)
				this.$el.addClass(this.options.contentClass);

			if(this.options.tableclass)
				this.$table.addClass(this.options.tableclass);

			this.renderFilter();
			
			this.renderHeader();
		},

		renderFilter: function () {
			
			var self = this;

			self.clearFilter();

			if(self.options.contentSearchClass) {
				self.$divFilter.addClass(this.options.contentSearchClass);
			}
			
			var $divGroup = $('<div />', { class: 'btn-group' });
			
			var $btn = $('<button />', { class: 'btn dropdown-toggle', tabindex: -1 }).append($('<span />', { class: 'caret' }))
																					  .attr('data-toggle', 'dropdown');
			var header = '';
			$(self.options.columns).each(function(i, col)
			{
				if(col.key === self.options.keySearch)
					header = col.header;
			});
				
			var $selectedValue = $('<span />', { class: 'add-on', tabindex: -1, text:  header});

			var $selectKey = $('<ul />', { class: 'dropdown-menu' });

			$divGroup.append($selectedValue).append($btn).append($selectKey);
			
			var type = typeof self.options.data[0][self.options.keySearch];
					
			if(type === 'boolean'){
				self.$divFilter.append($divGroup).append(self.$options);
			}
			else{
				self.$divFilter.append($divGroup).append(self.$input);
			}

			var columns = self.options.columns;
					
			$(columns).each(function(colIndex, col){
				var $li = $('<li />').append($('<a />', {text: col.header, href: '#' }));
				$li.attr('data-key', col.key);
				$selectKey.append($li);

				$li.click(function(){
					self.options.keySearch = $(this).attr('data-key');
					self.renderFilter();
				});
			});

			self.$input.keyup(function () {
				
				console.log(self.options.keySearch);
				var filterOps = [{key: self.options.keySearch, value: self.$input.val(), operator: self.options.operatorSearch}];
				self.options.filterOptions = filterOps;
				self.options.currentPage = 1;
				self._firstPage = 1;

				self.filter();
			});

			self.$options.change(function () {

				console.log(self.options.keySearch);
				var filterOps = [{key: self.options.keySearch, value: self.$options.val(), operator: self.options.operatorSearch}];
				self.options.filterOptions = filterOps;
				self.options.currentPage = 1;
				self._firstPage = 1;

				self.filter();
			});
		},
		
		renderHeader: function () {

			var self = this;

			var $row = $('<tr/>');
			var $thead = $('<thead/>').append($row);

			$row.hover(function () {
				$(this).css('cursor',' pointer');
			});


			var columns = this.options.columns;
					
			$(columns).each(function(colIndex, col){
				
				var $col = $('<th />').text(col.header);
				$row.append($col);
				
				if(col.classHeader){
					$col.addClass(col.classHeader);
				}

				$col.click(function () {
					var order = '';
					if($(this).find('.icon-chevron-up').length > 0) {

						self.$table.find('th i').remove();
						$(this).append($('<i />', { class: ' icon-chevron-down pull-right' }));
						order = 'desc';
					}
					else{

						self.$table.find('th i').remove();
						$(this).append($('<i />', { class: '  icon-chevron-up pull-right' }));
						order = 'asc';
					}

					self.options.orderSort = order;
					self.options.keySort = col.key;
					self.renderRows();
				});

				self.$table.append($thead);
			});
		},

		renderRows: function () {
			
			var self = this;

			self.clearRows();
			
			self.sort();

			var columns = self.options.columns;
			
			var starting = (self.options.currentPage - 1) * self.options.pageSize;
			var ending = (self.options.currentPage * self.options.pageSize);

			$(this._data).slice(starting, ending).each(function(index, e){
				
				var $row = $('<tr/>');	

				var $col;
				$(columns).each(function(colIndex, col){

					if(col.templateId){
						$col = $('<td/>');
						var template = _.template($('#' + col.templateId).html());
						$col.html(template(e));
					}
					else if(typeof e[col.key] === 'boolean'){
						$col = $('<td/>');
						var $chk = $('<input/>', { type: 'checkbox', checked: e[col.key] });
						$col.append($chk);
						$chk.bind('change', function(){
							e[col.key] = this.checked;
						});
					}
					else{
						
						$col = $('<td/>', { text: e[col.key] }).attr('data-key', col.key);
						
						$col.click(function () {
							self.options.rowClick(e);
						});
					}
					$row.append($col);
				});
				
				//$row.click(function () {
				//	self.options.rowClick(e);
				//});

				$row.hover(function(){
					$(this).css('cursor',' pointer');
				});
				
				self.$table.append($row);
			
			});

			self.renderPagination();

			self.highlight();
		},
		
		renderPagination: function () {
			
			var self = this;
			
			self.clearPagination();

			var totalPages = self._totalPages();
			
			if(totalPages > 1){

				var $pag = $('<div/>', { id: self.element.id + 'PaginationGridJS', name: self.element.id + 'PaginationGridJS', class: 'pagination' });
				
				if(self.options.paginationClass)
					$pag.addClass(self.options.paginationClass);

				var $ul = $('<ul/>');
				$pag.append($ul);

				lastPage = totalPages;

				if(totalPages > self._firstPage + 4)
					lastPage = self._firstPage + 4;
				
				var $li = $('<li/>').append($('<a/>', {href: 'javascript:', text: '<<'}));
				$ul.append($li);
				if(self._firstPage > 1){
					$li.click(function(){
						self._firstPage = self._firstPage - 5;
						self.options.currentPage = self._firstPage + 4;
						self.filter();
					});
				}
				else
				{
					$li.addClass('disabled');
				}

				for(var i = self._firstPage; i <= lastPage; i++){
				
					$li = $('<li/>').append($('<a/>', {href: 'javascript:', text: i}));
					$ul.append($li);
					$li.click(function () {
						self.options.currentPage = parseInt($(this).find('a:eq(0)').text());
						self.filter();
					});
				}

				$li = $('<li/>').append($('<a/>', {href: 'javascript:', text: '>>'}));
				$ul.append($li);
				if(lastPage < totalPages){
					$li.click(function () {
						self._firstPage = lastPage + 1;
						self.options.currentPage = lastPage + 1;
						self.filter();
					});
				}
				else{
					$li.addClass('disabled');
				}

				self.$el.append($pag);

				$($('.pagination li:contains("' + self.options.currentPage + '")')[0]).addClass('active');
			}
		},
		
		filter: function () {
			
			var self = this;
			self._data = $.grep(this.options.data, function (e, index) {
				var isValid = true;
				$(self.options.filterOptions).each(function(index, op){
					isValid = isValid && Filter.prototype.compare(e, op);
				});
				return isValid;
			});

			self.renderRows();
			
			return self._data;
        },

		compare: function(e, op) {
			
			switch(op.operator)
			{
				case OperatorTypes.GREATER:
					return e[op.key] > op.value;
				case OperatorTypes.LESS:
					return e[op.key] < op.value;
				case OperatorTypes.GREATER_OR_EQUAL:
					return e[op.key] >= op.value;
				case OperatorTypes.LESS_OR_EQUAL:
					return e[op.key] <= op.value;
				case OperatorTypes.CONTAINS:
				{
					if(op.value){
						var term = op.value.toString() + '+';
						var pattern = new RegExp(term, 'i');
						return pattern.test(e[op.key]);
					}
					
					return true;
				}
				case OperatorTypes.STARTS_WITH:
				{
					if(op.value){
						var term = '^' + op.value;
						var pattern = new RegExp(term, 'i');
						return pattern.test(e[op.key]);
					}
					
					return true;
				}
				default:
				{
					if(op.value){
						if(typeof e[op.key] === "string" ){
							return e[op.key].toString().toLowerCase() === op.value.toString().toLowerCase();
						}
						return e[op.key] == op.value;
					}
					return true;
				}
			}
		},
		
		sort: function(){

			if(this.options.orderSort && this.options.keySort){

				if(this.options.orderSort.toLowerCase() === 'asc')
					this.sortAsc(this.options.keySort);
				else
					this.sortDesc(this.options.keySort);
			}
		},

		sortAsc: function(key){
			this._data = this._data.sort(function (obj1, obj2) {
						return obj1[key] < obj2[key] ? -1 : (obj1[key] > obj2[key] ? 1 : 0);
					  });
		},
		
		sortDesc: function(key){
			this._data = this._data.sort(function (obj1, obj2) {
						return obj1[key] > obj2[key] ? -1 : (obj1[key] < obj2[key] ? 1 : 0);
					  });
		},
		
		highlight: function() {
			var term = this.$input.val();
			if (term) {
				term = term.replace(/(\s+)/,"(<[^>]+>)*$1(<[^>]+>)*");
				this.$table.find('tbody td[data-key="' + this.options.keySearch + '"]').each(function(index, td){
					var src_str = $(td).text();
					var pattern = new RegExp("("+term+")", "i");
					src_str = src_str.replace(pattern, "<mark>$1</mark>");
					$(td).html(src_str);
				});
			}
		},
		
		clear: function() {
			this.$el.find('table').remove();
			this.clearPagination();
		},
		
		clearRows: function() {
			this.$table.find('tbody').remove();
		},

		clearPagination: function(){
			this.$el.find('.pagination').remove();
		},

		clearFilter: function(){
			this.$divFilter.html('');
		}
		
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName, new Filter(this, options));
            }
        });
    };
	
	$.fn.search = function(options){
		return this.each(function () {
			$(this).JSONFilter(options);
			var jsonFilter = $.data(this, "plugin_" + pluginName);
			jsonFilter.options.filterOptions = options.filterOptions;
			jsonFilter.filter();
		});
	};

})(jQuery, window, document);
