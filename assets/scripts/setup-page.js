function PmbSetupPage(pmb_instance_vars, translations) {
	this.default_rest_url = pmb_instance_vars.default_rest_url;
	this.proxy_for = '';
	this.site_name = '';
	this.spinner = jQuery(pmb_instance_vars.spinner_selector);
	this.site_ok = jQuery(pmb_instance_vars.site_ok_selector);
	this.site_bad = jQuery(pmb_instance_vars.site_bad_selector);
	this.site_status = jQuery(pmb_instance_vars.site_status_selector);
	this.dynamic_categories = jQuery(pmb_instance_vars.dynamic_categories_selector);
	this.translations = translations;
	this.taxonomies = [];

	site_input = jQuery(pmb_instance_vars.site_input_selector);


	this.init = function() {
		jQuery(site_input).keyup(
			jQuery.debounce(
				() => {
					return this.updateRestApiUrl(site_input.val());
				},
				2000
			)
		);
		this.updateRestApiUrl(site_input.val());
	};

	this.updateRestApiUrl = function(site_url) {
		if(site_url === '') {
			this.proxy_for = '';
			this.getTaxonomies();
		}
		this.spinner.show();
		this.site_bad.hide();
		this.site_ok.hide();

		var data = {
			'action': 'pmb_fetch_rest_api_url',
			'site': site_url
		};

		// since 2.8 ajaxurl is always defined in the admin header and points to admin-ajax.php
		jQuery.post(ajaxurl, data, (response) => {
				this.spinner.hide();
				if(response.success && response.data.name && response.data.proxy_for){
					if( ! response.data.is_local){
						this.proxy_for =	response.data.proxy_for;
					} else {
						this.proxy_for = '';
					}
					this.site_name = response.data.name;
					this.site_ok.show();
					this.getTaxonomies();
				} else if(response.data.error && response.data.message) {
					this.reportNoRestApiUrl(response.data.message, response.data.error);
				} else {
					this.reportNoRestApiUrl(response.data.unknown_site_name, 'no_code');
				}
			},
			'json'
		).fail( (event) => {
			this.spinner.hide();
		});
	};

	this.reportNoRestApiUrl = function(error_string, code) {
		this.site_bad.show();
		this.site_status.html(error_string + ' [' + code + '] ');
	};

	this.getTaxonomies = function() {
		var alltaxonomiesCollection = new wp.api.collections.Taxonomies();
		let data = {
			proxy_for : this.proxy_for
		};
		alltaxonomiesCollection.fetch({data:data}).done((taxonomies) => {
			this.taxonomies = taxonomies;
			this.generateTaxonomyInputs();
		});
	};

	this.generateTaxonomyInputs = function() {
		this.dynamic_categories.html('');
		jQuery.each(this.taxonomies, (index, taxonomy)=>{
			const slug = taxonomy.rest_base;
			this.dynamic_categories.append(
				'<tr><th scope="row"><label for="' + slug + '">' + taxonomy.name+ '</label></th><td><select id="' + slug + '" name="filters[' + slug + '][]" multiple="multiple"></select></td></tr>'
			);
			jQuery('#'+slug).select2({
				ajax: {
					url: this.default_rest_url + '/' + taxonomy.rest_base,
					dataType: 'json',
					// Additional AJAX parameters go here; see the end of this chapter for the full code of this example
					data: (params) => {
						var query = {
							_envelope:1,
						};
						if(params.term){
							query.search=params.term;
						}
						if(params.page){
							query.page=params.page;
						}
						if(this.proxy_for){
							query.proxy_for = this.proxy_for;
						}
						return query;
					},
					processResults: (data, params) => {
						const current_page = params.page || 1;
						let prepared_data = {
							results: [],
							pagination:{
								more:data.headers['X-WP-TotalPages'] > current_page
							}
						};
						for(var i=0; i<data.body.length; i++){
							let term = data.body[i];
							prepared_data.results.push({
								id:term.id,
								text: term.name
							});
						}
						return prepared_data;
					}
				}
			});
		});
	};
}

var pmb = null;
jQuery(document).ready(function () {
	wp.api.loadPromise.done( function() {
		// @var object pmb_setup_page
		pmb = new PmbSetupPage(pmb_setup_page.data, pmb_setup_page.translations);
		pmb.init();
	});
});