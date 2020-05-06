
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.21.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Component.svelte generated by Svelte v3.21.0 */

    const file = "src/Component.svelte";

    function create_fragment(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			set_style(img, "height", /*height*/ ctx[1]);
    			set_style(img, "margin", "0.1em");
    			if (img.src !== (img_src_value = "./" + /*name*/ ctx[0] + ".png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*name*/ ctx[0]);
    			add_location(img, file, 4, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*height*/ 2) {
    				set_style(img, "height", /*height*/ ctx[1]);
    			}

    			if (dirty & /*name*/ 1 && img.src !== (img_src_value = "./" + /*name*/ ctx[0] + ".png")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(img, "alt", /*name*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let { height = "1.3em" } = $$props;
    	const writable_props = ["name", "height"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Component> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Component", $$slots, []);

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    	};

    	$$self.$capture_state = () => ({ name, height });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, height];
    }

    class Component extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0, height: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Component",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Component> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<Component>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Component>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Component>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Component>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Card.svelte generated by Svelte v3.21.0 */
    const file$1 = "src/Card.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (35:4) {#if obj.alchemy_dc}
    function create_if_block(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let t1_value = /*obj*/ ctx[0].alchemy_dc + "";
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let t4_value = /*obj*/ ctx[0].time + "";
    	let t4;
    	let t5;
    	let t6;
    	let div2;
    	let t7;
    	let t8_value = /*obj*/ ctx[0].craft_cost + "";
    	let t8;
    	let current;
    	let if_block = /*obj*/ ctx[0].components && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text("Alchemy DC: ");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			t3 = text("Time: ");
    			t4 = text(t4_value);
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			div2 = element("div");
    			t7 = text("Formula cost: ");
    			t8 = text(t8_value);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$1, 36, 8, 706);
    			attr_dev(div1, "class", "col");
    			add_location(div1, file$1, 39, 8, 786);
    			attr_dev(div2, "class", "col");
    			add_location(div2, file$1, 49, 8, 1043);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$1, 35, 6, 680);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			append_dev(div3, t5);
    			if (if_block) if_block.m(div3, null);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, t7);
    			append_dev(div2, t8);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*obj*/ 1) && t1_value !== (t1_value = /*obj*/ ctx[0].alchemy_dc + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*obj*/ 1) && t4_value !== (t4_value = /*obj*/ ctx[0].time + "")) set_data_dev(t4, t4_value);

    			if (/*obj*/ ctx[0].components) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*obj*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, t6);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*obj*/ 1) && t8_value !== (t8_value = /*obj*/ ctx[0].craft_cost + "")) set_data_dev(t8, t8_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(35:4) {#if obj.alchemy_dc}",
    		ctx
    	});

    	return block;
    }

    // (43:8) {#if obj.components}
    function create_if_block_1(ctx) {
    	let div;
    	let current;
    	let each_value = /*obj*/ ctx[0].components;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "col-sm");
    			add_location(div, file$1, 43, 10, 885);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*obj*/ 1) {
    				each_value = /*obj*/ ctx[0].components;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(43:8) {#if obj.components}",
    		ctx
    	});

    	return block;
    }

    // (45:12) {#each obj.components as c}
    function create_each_block(ctx) {
    	let current;

    	const component = new Component({
    			props: { name: /*c*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(component.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(component, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const component_changes = {};
    			if (dirty & /*obj*/ 1) component_changes.name = /*c*/ ctx[1];
    			component.$set(component_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(component.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(component.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(component, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(45:12) {#each obj.components as c}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div10;
    	let div9;
    	let div6;
    	let div0;
    	let h4;
    	let t0_value = /*obj*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let hr;
    	let t2;
    	let div5;
    	let div4;
    	let div1;
    	let t3;
    	let t4_value = /*obj*/ ctx[0].avail + "";
    	let t4;
    	let t5;
    	let div2;
    	let t6;
    	let t7_value = /*obj*/ ctx[0].weight + "";
    	let t7;
    	let t8;
    	let div3;
    	let t9;
    	let t10_value = /*obj*/ ctx[0].cost + "";
    	let t10;
    	let t11;
    	let t12;
    	let div8;
    	let div7;
    	let t13_value = /*obj*/ ctx[0].effect + "";
    	let t13;
    	let current;
    	let if_block = /*obj*/ ctx[0].alchemy_dc && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div9 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text(t0_value);
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			t3 = text("Avail: ");
    			t4 = text(t4_value);
    			t5 = space();
    			div2 = element("div");
    			t6 = text("Weight: ");
    			t7 = text(t7_value);
    			t8 = space();
    			div3 = element("div");
    			t9 = text("Cost: ");
    			t10 = text(t10_value);
    			t11 = space();
    			if (if_block) if_block.c();
    			t12 = space();
    			div8 = element("div");
    			div7 = element("div");
    			t13 = text(t13_value);
    			add_location(h4, file$1, 17, 8, 276);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$1, 16, 6, 250);
    			add_location(hr, file$1, 19, 6, 317);
    			attr_dev(div1, "class", "col-3");
    			add_location(div1, file$1, 22, 10, 386);
    			attr_dev(div2, "class", "col-5");
    			add_location(div2, file$1, 25, 10, 464);
    			attr_dev(div3, "class", "col-3");
    			add_location(div3, file$1, 28, 10, 544);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$1, 21, 8, 358);
    			attr_dev(div5, "class", "col-sm");
    			add_location(div5, file$1, 20, 6, 329);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$1, 15, 4, 226);
    			attr_dev(div7, "class", "col");
    			add_location(div7, file$1, 55, 6, 1176);
    			attr_dev(div8, "class", "row content svelte-7chdhm");
    			add_location(div8, file$1, 54, 4, 1144);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file$1, 14, 2, 198);
    			attr_dev(div10, "class", "card top svelte-7chdhm");
    			add_location(div10, file$1, 13, 0, 173);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div9);
    			append_dev(div9, div6);
    			append_dev(div6, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(div6, t1);
    			append_dev(div6, hr);
    			append_dev(div6, t2);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			append_dev(div4, t5);
    			append_dev(div4, div2);
    			append_dev(div2, t6);
    			append_dev(div2, t7);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, t9);
    			append_dev(div3, t10);
    			append_dev(div9, t11);
    			if (if_block) if_block.m(div9, null);
    			append_dev(div9, t12);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, t13);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*obj*/ 1) && t0_value !== (t0_value = /*obj*/ ctx[0].name + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*obj*/ 1) && t4_value !== (t4_value = /*obj*/ ctx[0].avail + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty & /*obj*/ 1) && t7_value !== (t7_value = /*obj*/ ctx[0].weight + "")) set_data_dev(t7, t7_value);
    			if ((!current || dirty & /*obj*/ 1) && t10_value !== (t10_value = /*obj*/ ctx[0].cost + "")) set_data_dev(t10, t10_value);

    			if (/*obj*/ ctx[0].alchemy_dc) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*obj*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div9, t12);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*obj*/ 1) && t13_value !== (t13_value = /*obj*/ ctx[0].effect + "")) set_data_dev(t13, t13_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { obj } = $$props;
    	const writable_props = ["obj"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Card", $$slots, []);

    	$$self.$set = $$props => {
    		if ("obj" in $$props) $$invalidate(0, obj = $$props.obj);
    	};

    	$$self.$capture_state = () => ({ Component, obj });

    	$$self.$inject_state = $$props => {
    		if ("obj" in $$props) $$invalidate(0, obj = $$props.obj);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [obj];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { obj: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*obj*/ ctx[0] === undefined && !("obj" in props)) {
    			console.warn("<Card> was created without expected prop 'obj'");
    		}
    	}

    	get obj() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set obj(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Substance.svelte generated by Svelte v3.21.0 */
    const file$2 = "src/Substance.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (66:8) {:else}
    function create_else_block(ctx) {
    	let t0;
    	let t1_value = /*l*/ ctx[9] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("FIXME: ");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*substance*/ 1 && t1_value !== (t1_value = /*l*/ ctx[9] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(66:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (64:8) {#if styles[l] != undefined }
    function create_if_block$1(ctx) {
    	let span;
    	let t_value = /*l*/ ctx[9] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge room-right svelte-13affwe");
    			set_style(span, "background-color", /*styles*/ ctx[1][/*l*/ ctx[9]]);
    			set_style(span, "color", "#fff");
    			add_location(span, file$2, 64, 10, 1191);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*substance*/ 1 && t_value !== (t_value = /*l*/ ctx[9] + "")) set_data_dev(t, t_value);

    			if (dirty & /*substance*/ 1) {
    				set_style(span, "background-color", /*styles*/ ctx[1][/*l*/ ctx[9]]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(64:8) {#if styles[l] != undefined }",
    		ctx
    	});

    	return block;
    }

    // (63:6) {#each substance.location as l}
    function create_each_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*styles*/ ctx[1][/*l*/ ctx[9]] != undefined) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(63:6) {#each substance.location as l}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*substance*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2;
    	let td2;
    	let t3;
    	let td3;
    	let t4_value = /*substance*/ ctx[0].rarity + "";
    	let t4;
    	let t5;
    	let td4;
    	let t6_value = /*substance*/ ctx[0].quantity + "";
    	let t6;
    	let t7;
    	let td5;
    	let t8_value = /*substance*/ ctx[0].forage + "";
    	let t8;
    	let t9;
    	let td6;
    	let t10_value = /*substance*/ ctx[0].weight + "";
    	let t10;
    	let t11;
    	let td7;
    	let t12_value = /*substance*/ ctx[0].cost + "";
    	let t12;
    	let current;

    	const component = new Component({
    			props: { name: /*substance*/ ctx[0].substance },
    			$$inline: true
    		});

    	let each_value = /*substance*/ ctx[0].location;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			create_component(component.$$.fragment);
    			t2 = space();
    			td2 = element("td");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			td3 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td4 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td5 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td6 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td7 = element("td");
    			t12 = text(t12_value);
    			add_location(td0, file$2, 59, 2, 1017);
    			add_location(td1, file$2, 60, 2, 1045);
    			add_location(td2, file$2, 61, 4, 1100);
    			add_location(td3, file$2, 70, 2, 1363);
    			add_location(td4, file$2, 71, 2, 1393);
    			add_location(td5, file$2, 72, 2, 1425);
    			add_location(td6, file$2, 73, 2, 1455);
    			add_location(td7, file$2, 74, 2, 1485);
    			add_location(tr, file$2, 58, 0, 1010);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			mount_component(component, td1, null);
    			append_dev(tr, t2);
    			append_dev(tr, td2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(td2, null);
    			}

    			append_dev(tr, t3);
    			append_dev(tr, td3);
    			append_dev(td3, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td4);
    			append_dev(td4, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td5);
    			append_dev(td5, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td6);
    			append_dev(td6, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td7);
    			append_dev(td7, t12);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*substance*/ 1) && t0_value !== (t0_value = /*substance*/ ctx[0].name + "")) set_data_dev(t0, t0_value);
    			const component_changes = {};
    			if (dirty & /*substance*/ 1) component_changes.name = /*substance*/ ctx[0].substance;
    			component.$set(component_changes);

    			if (dirty & /*styles, substance, undefined*/ 3) {
    				each_value = /*substance*/ ctx[0].location;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(td2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if ((!current || dirty & /*substance*/ 1) && t4_value !== (t4_value = /*substance*/ ctx[0].rarity + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty & /*substance*/ 1) && t6_value !== (t6_value = /*substance*/ ctx[0].quantity + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*substance*/ 1) && t8_value !== (t8_value = /*substance*/ ctx[0].forage + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*substance*/ 1) && t10_value !== (t10_value = /*substance*/ ctx[0].weight + "")) set_data_dev(t10, t10_value);
    			if ((!current || dirty & /*substance*/ 1) && t12_value !== (t12_value = /*substance*/ ctx[0].cost + "")) set_data_dev(t12, t12_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(component.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(component.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(component);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { substance } = $$props;

    	// FIXME: make the colors more readable
    	let black = "black";

    	let blue = "blue";
    	let brown = "brown";
    	let green = "green";
    	let grey = "grey";
    	let red = "red";
    	let yellow = "yellow";

    	let styles = {
    		"Fields": green,
    		"Forests": green,
    		"Mountains": grey,
    		"Cities": grey,
    		"Underground": black,
    		"Caves": black,
    		"Swamps": brown,
    		"Ghouls": red,
    		"Nekkers": red,
    		"Rock Trolls": red,
    		"Wraiths": red,
    		"Drowners": red,
    		"Grave Hags": red,
    		"Sirens": red,
    		"Noon Wraiths": red,
    		"Griffins": red,
    		"Griffin Nests": red,
    		"Golems": red,
    		"Werewolves": red,
    		"Arachasae": red,
    		"Endrega": red,
    		"Endrega Nests": red,
    		"Fiends": red,
    		"Fiend Territory": red,
    		"Katakans": red,
    		"Wyverns": red,
    		"Dogs": red,
    		"Wolves": red,
    		"Ocean floor": blue,
    		"Shore": blue,
    		"The Blue Mountains": blue,
    		"Breweries": yellow
    	};

    	const writable_props = ["substance"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Substance> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Substance", $$slots, []);

    	$$self.$set = $$props => {
    		if ("substance" in $$props) $$invalidate(0, substance = $$props.substance);
    	};

    	$$self.$capture_state = () => ({
    		substance,
    		Component,
    		black,
    		blue,
    		brown,
    		green,
    		grey,
    		red,
    		yellow,
    		styles
    	});

    	$$self.$inject_state = $$props => {
    		if ("substance" in $$props) $$invalidate(0, substance = $$props.substance);
    		if ("black" in $$props) black = $$props.black;
    		if ("blue" in $$props) blue = $$props.blue;
    		if ("brown" in $$props) brown = $$props.brown;
    		if ("green" in $$props) green = $$props.green;
    		if ("grey" in $$props) grey = $$props.grey;
    		if ("red" in $$props) red = $$props.red;
    		if ("yellow" in $$props) yellow = $$props.yellow;
    		if ("styles" in $$props) $$invalidate(1, styles = $$props.styles);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [substance, styles];
    }

    class Substance extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { substance: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Substance",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*substance*/ ctx[0] === undefined && !("substance" in props)) {
    			console.warn("<Substance> was created without expected prop 'substance'");
    		}
    	}

    	get substance() {
    		throw new Error("<Substance>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set substance(value) {
    		throw new Error("<Substance>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var alchemicalItems = [
    	{
    		name: "Acid Solution",
    		avail: "P",
    		effect: "Acid solution does 2d6 damage to any living creature it is thrown on and does 1d6/2 ablation damage to weapons and armor. Throwing it is an Athletics attack with a range equal to your BODYx2m, and the acid splatters in a 2m cone directly away from where it lands.",
    		weight: "0.5",
    		cost: "56",
    		alchemy_dc: "16",
    		time: "15 Minutes",
    		components: [
    			"aether",
    			"quebrith",
    			"vermilion",
    			"vitriol",
    			"vitriol",
    			"vitriol"
    		],
    		craft_cost: "84",
    		difficulty: "novice"
    	},
    	{
    		name: "Adda’s Tomb",
    		avail: "C",
    		effect: "A dose of Adda’s tomb can be poured onto perishable foods or even corpses. Treated perishables will not begin to rot or spoil for 1d10 days. Preserving a human-sized body requires 2 doses.",
    		weight: ".1",
    		cost: "18",
    		alchemy_dc: "13",
    		time: "5 Rounds",
    		components: [
    			"aether",
    			"aether",
    			"hydragenum",
    			"vermilion"
    		],
    		craft_cost: "27",
    		difficulty: "novice"
    	},
    	{
    		name: "Alchemical Adhesive",
    		avail: "C",
    		effect: "Alchemical adhesive can be thrown or poured onto a place or person. After 2 rounds the solution will harden, permanently sticking objects together, and sticking people to one another or to objects. The objects must be pried apart with a DC:16 Physique check. Throwing it is an Athletics attack with a range equal to your BODYx2m.",
    		weight: ".1",
    		cost: "28",
    		alchemy_dc: "15",
    		time: "10 Minutes",
    		components: [
    			"quebrith",
    			"hydragenum",
    			"caelum",
    			"caelum",
    			"vitriol"
    		],
    		craft_cost: "52",
    		difficulty: "journeyman"
    	},
    	{
    		name: "Base Powder",
    		avail: "C",
    		effect: "Base powder counteracts the effect acid, negating one dose of acid solution per dose of base powder used. Base powder can also negate damage from a torn stomach critical wound.",
    		weight: ".1",
    		cost: "18",
    		alchemy_dc: "12",
    		time: "5 Rounds",
    		components: [
    			"vermilion",
    			"quebrith"
    		],
    		craft_cost: "27",
    		difficulty: "novice"
    	},
    	{
    		name: "Black Venom",
    		avail: "C",
    		effect: "Black venom immediately poisons a target if it gets into their bloodstream or is ingested. A DC:16 Endurance check ends the effect, but the target can become poisoned again if they consume more black venom or are cut by a poisoned weapon.",
    		weight: ".1",
    		cost: "45",
    		alchemy_dc: "15",
    		time: "10 Minutes",
    		components: [
    			"quebrith",
    			"quebrith",
    			"aether",
    			"aether",
    			"rebis"
    		],
    		craft_cost: "67",
    		difficulty: "journeyman"
    	},
    	{
    		name: "Bredan’s Fury",
    		avail: "R",
    		effect: "Bredan’s fury explodes when exposed to air, doing 2d6 damage to every body location of any creature within 2m. Throwing it is a an Athletics attack with a range equal to your BODYx2m.",
    		weight: ".5",
    		cost: "95",
    		alchemy_dc: "22",
    		time: "1/2 Hour",
    		components: [
    			"sol",
    			"sol",
    			"sol",
    			"fulgur",
    			"fulgur",
    			"fulgur",
    			"caelum",
    			"vermilion"
    		],
    		craft_cost: "142",
    		difficulty: "master"
    	},
    	{
    		name: "Chloroform",
    		avail: "C",
    		effect: "Chloroform forces anyone who breathes it to make a Stun save at -2 or be knocked unconcious until they do make the save. Using it usually requires a Melee attack with a cloth soaked in the chloroform. It can also be poured into a vessel. Each bottle contains 25 doses.",
    		weight: ".1",
    		cost: "36",
    		alchemy_dc: "16",
    		time: "15 Minutes",
    		components: [
    			"quebrith",
    			"quebrith",
    			"vermilion",
    			"vermilion",
    			"aether",
    			"vitriol"
    		],
    		craft_cost: "54",
    		difficulty: "journeyman"
    	},
    	{
    		name: "Clotting Powder",
    		avail: "C",
    		effect: "Applying clotting powder to a wound stops the bleedino er the rounds elapse the wound begins bleeding again. You can then apply another dose.",
    		weight: ".1",
    		cost: "20",
    		alchemy_dc: "12",
    		time: "5 Rounds",
    		components: [
    			"aether",
    			"rebis"
    		],
    		craft_cost: "30",
    		difficulty: "novice"
    	},
    	{
    		name: "Fisstech",
    		avail: "P",
    		effect: "Fisstech sends those who snort it or rub it on their gums into a euphoric trance-like state. It is often used as an anesthetic, as it numbs pain. It is highly addictive. After each use, make an Endurance check at DC:18. If you fail, you become addicted. See pg.32 for addiction rules.",
    		weight: ".1",
    		cost: "80",
    		alchemy_dc: "18",
    		time: "1/2 Hour",
    		components: [
    			"rebis",
    			"rebis",
    			"rebis",
    			"hydragenum",
    			"hydragenum",
    			"vitriol",
    			"vitriol",
    			"vermilion"
    		],
    		craft_cost: "120",
    		difficulty: "master"
    	},
    	{
    		name: "Hallucinogen",
    		avail: "C",
    		effect: "Hallucinogen can be thrown on a target within 3m or slipped into a drink. If the target fails a DC:15 Endurance check, they start hallucinating. These hallucinations last for 1d10 rounds.",
    		weight: ".1",
    		cost: "25",
    		alchemy_dc: "12",
    		time: "5 Rounds",
    		components: [
    			"vitriol",
    			"rebis"
    		],
    		craft_cost: "47",
    		difficulty: "novice"
    	},
    	{
    		name: "Invisible Ink",
    		avail: "C",
    		effect: "Invisible ink allows you to write messages that can only be read when exposed to heat for 1 turn. .1 1d don’t stack.",
    		weight: ".1",
    		cost: "22",
    		alchemy_dc: "11",
    		time: "5 Rounds",
    		components: [
    			"quebrith",
    			"aether"
    		],
    		craft_cost: "22",
    		difficulty: "novice"
    	},
    	{
    		name: "Succubus’ Breath",
    		avail: "C",
    		effect: "A dose of succubus’ breath can be used to aid seduction. Used on the skin, it gives you a +2 to Seduction. If poured into someone’s drink, it gives them a -5 to Seduction Resistance. Like black venom, it takes a DC:16 Awareness check to realize there is succubus’ breath in a drink.",
    		weight: ".1",
    		cost: "20",
    		alchemy_dc: "14",
    		time: "10 Minutes",
    		components: [
    			"sol",
    			"aether",
    			"aether",
    			"caelum"
    		],
    		craft_cost: "30",
    		difficulty: "novice"
    	},
    	{
    		name: "Talgar’s Tears",
    		avail: "P",
    		effect: "Talgar’s tears immediately freezes anything it is thrown on. If used on weapons, armor, or objects, those items take double ablation damage rowing it is an Athletics attack with a range equal to your BODYx2m, and the liquid splatters in a 2m cone directly away from where it lands, freezing anything it hit",
    		weight: ".5",
    		cost: "795",
    		alchemy_dc: "20",
    		time: "1/2 Hour",
    		components: [
    			"hydragenum",
    			"hydragenum",
    			"hydragenum",
    			"aether",
    			"aether",
    			"vermilion",
    			"vitriol",
    			"vitriol"
    		],
    		craft_cost: "118",
    		difficulty: "master"
    	},
    	{
    		name: "Wive’s Tears Potion",
    		avail: "P",
    		effect: "Imbibing wives’ tears potion negates the ef intoxication. Immediately a er drinking a dose of wives’ tears potion the imbiber sobers up.",
    		weight: ".1",
    		cost: "56",
    		alchemy_dc: "14",
    		time: "10 Minutes",
    		components: [
    			"hydragenum",
    			"aether",
    			"aether",
    			"vitriol"
    		],
    		craft_cost: "28",
    		difficulty: "novice"
    	},
    	{
    		name: "Zerrikanian Fire",
    		avail: "P",
    		effect: "Zerrikanian fire immediately sets whatever it touches on fire. Throwing it is an Athletics attack with a range equal to your BODYx2m, and the it splatters in a 2m cone away from where it lands, lighting anyone and anything in that area on fire.",
    		weight: ".5",
    		cost: "65",
    		alchemy_dc: "17",
    		time: "15 Minutes",
    		components: [
    			"sol",
    			"sol",
    			"rebis",
    			"rebis",
    			"rebis",
    			"fulgur",
    			"vitriol"
    		],
    		craft_cost: "97",
    		difficulty: "master"
    	},
    	{
    		name: "Numbing Herbs",
    		avail: "E",
    		effect: "Numbing herbs placed in a wound relieve pain, lowering negatives from critical wounds by 2. Numbing herbs also lessen penalties from being near death by 2. Numbing herbs work for 2d10 rounds, and then you can apply another dose",
    		weight: ".1",
    		cost: "12",
    		alchemy_dc: "12",
    		time: "5 Rounds",
    		components: [
    			"quebrith",
    			"vermilion"
    		],
    		craft_cost: "18",
    		difficulty: "novice"
    	},
    	{
    		name: "Poisoner’s Friend",
    		avail: "C",
    		effect: "Poisoner’s friend is a clear liquid that can be poured into food or drink to give it a potent savory or sweet taste is raises the DC to detect poison to 20.",
    		weight: ".1",
    		cost: "16",
    		alchemy_dc: "14",
    		time: "10 Minutes",
    		components: [
    			"vermilion",
    			"vermilion",
    			"vitriol",
    			"caelum"
    		],
    		craft_cost: "24",
    		difficulty: "novice"
    	},
    	{
    		name: "Smelling Salts",
    		avail: "C",
    		effect: "Smelling salts can be placed under an unconcious or stunned person, or creature’s nose to immediately bring them out of their stunned state. Smelling salts can be used 25 times.",
    		weight: ".1",
    		cost: "25",
    		alchemy_dc: "14",
    		time: "10 Minutes",
    		components: [
    			"quebrith",
    			"rebis",
    			"caelum",
    			"caelum"
    		],
    		craft_cost: "37",
    		difficulty: "novice"
    	},
    	{
    		name: "Sterilizing Fluid",
    		avail: "C",
    		effect: "Sterlizing fluid poured on a wound raises the patient’s natural healing rate by 2 points and lessens the number of days a critical wound takes to heal by 2. Multiple uses of sterilizing fluid don't stack.",
    		weight: ".1",
    		cost: "22",
    		alchemy_dc: "12",
    		time: "5 Rounds",
    		components: [
    			"quebrith",
    			"caelum"
    		],
    		craft_cost: "33",
    		difficulty: "novice"
    	},
    	{
    		name: "Quick Fire",
    		avail: "P",
    		effect: "A dose of quick fire poured on a person, surface, or object, dries quickly. Anything so treated is extremely flammable. There’s a 50% chance it will ignite each time it’s exposed to flame or sparks of any kind.",
    		weight: ".1",
    		cost: "45",
    		alchemy_dc: "16",
    		time: "15 Minutes",
    		components: [
    			"quebrith",
    			"rebis",
    			"rebis",
    			"caelum",
    			"vitriol",
    			"vermilion"
    		],
    		craft_cost: "67",
    		difficulty: "journeyman"
    	},
    	{
    		name: "Pantagran’s Elixir",
    		avail: "P",
    		effect: "Consuming a draught of Pantagran’s elixir brings delirious happiness. This effect lasts for 1d6/2 hours and leaves the imbiber incredibly suceptible to Persuasion, Charisma, and Seduction, giving them a -2 to Resist Coercion.",
    		weight: ".5",
    		cost: "67",
    		alchemy_dc: "17",
    		time: "15 Minutes",
    		components: [
    			"vermilion",
    			"vermilion",
    			"aether",
    			"aether",
    			"caelum",
    			"sol",
    			"fulgur"
    		],
    		craft_cost: "100",
    		difficulty: "master"
    	},
    	{
    		name: "Perfume Potion",
    		avail: "P",
    		effect: "Someone who consumes a draught of perfume potionmust make a DC:16 Endurance check. Failure causes intoxication for 1d10 Hours. This intoxication can only be undone by magic or wives’ tears potion. Perfume potion has a Toxicity of 25%.",
    		weight: ".5",
    		cost: "76",
    		alchemy_dc: "18",
    		time: "1/2 Hour",
    		components: [
    			"quebrith",
    			"quebrith",
    			"aether",
    			"vitriol",
    			"vitriol",
    			"vermilion",
    			"hydragenum",
    			"hydragenum"
    		],
    		craft_cost: "114",
    		difficulty: "master"
    	}
    ];

    var alchemicalSubstances = [
    	{
    		name: "Balisse Fruit",
    		substance: "vitriol",
    		rarity: "C",
    		location: [
    			"Fields"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "8"
    	},
    	{
    		name: "Barley",
    		substance: "vitriol",
    		rarity: "C",
    		location: [
    			"Fields"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "9"
    	},
    	{
    		name: "Calcium Equum",
    		substance: "vitriol",
    		rarity: "C",
    		location: [
    			"Mountains",
    			"Underground"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "12"
    	},
    	{
    		name: "Crow’s Eye",
    		substance: "vitriol",
    		rarity: "P",
    		location: [
    			"Fields",
    			"Forests"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "17"
    	},
    	{
    		name: "Ghoul Claw",
    		substance: "vitriol",
    		rarity: "R",
    		location: [
    			"Ghouls"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: "1",
    		cost: "60"
    	},
    	{
    		name: "Nekker Teeth",
    		substance: "vitriol",
    		rarity: "P",
    		location: [
    			"Nekkers"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "30"
    	},
    	{
    		name: "Sewant Mushrooms",
    		substance: "vitriol",
    		rarity: "P",
    		location: [
    			"Caves"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "17"
    	},
    	{
    		name: "Troll Hide",
    		substance: "vitriol",
    		rarity: "R",
    		location: [
    			"Rock Trolls"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: "4.5",
    		cost: "147"
    	},
    	{
    		name: "White Myrtle Petals",
    		substance: "vitriol",
    		rarity: "C",
    		location: [
    			"Fields"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "8"
    	},
    	{
    		name: "Allspice Root",
    		substance: "aether",
    		rarity: "P",
    		location: [
    			"Fields"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "18"
    	},
    	{
    		name: "Berbercane Fruit",
    		substance: "aether",
    		rarity: "C",
    		location: [
    			"Mountains",
    			"Swamps"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "9"
    	},
    	{
    		name: "Essence of Wraith",
    		substance: "aether",
    		rarity: "R",
    		location: [
    			"Wraiths"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "95"
    	},
    	{
    		name: "Ginatia Petals",
    		substance: "aether",
    		rarity: "P",
    		location: [
    			"Fields"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "17"
    	},
    	{
    		name: "Hellebore Petals",
    		substance: "aether",
    		rarity: "P",
    		location: [
    			"Forests"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "19"
    	},
    	{
    		name: "Pearl",
    		substance: "aether",
    		rarity: "R",
    		location: [
    			"Ocean floor",
    			"Shore"
    		],
    		quantity: "d6/3 Units",
    		forage: "20",
    		weight: ".1",
    		cost: "100"
    	},
    	{
    		name: "Quicksilver Solution",
    		substance: "aether",
    		rarity: "R",
    		location: [
    			"Mountains",
    			"Underground"
    		],
    		quantity: "1d6/2 Units",
    		forage: "18",
    		weight: ".1",
    		cost: "77"
    	},
    	{
    		name: "Scleroderm",
    		substance: "aether",
    		rarity: "E",
    		location: [
    			"Forests",
    			"Caves"
    		],
    		quantity: "2d6 Units",
    		forage: "10",
    		weight: ".1",
    		cost: "5"
    	},
    	{
    		name: "Celandine",
    		substance: "rebis",
    		rarity: "C",
    		location: [
    			"Fields",
    			"Forests"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "8"
    	},
    	{
    		name: "Drowner Brain",
    		substance: "rebis",
    		rarity: "P",
    		location: [
    			"Drowners"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: "1",
    		cost: "80"
    	},
    	{
    		name: "Han Fiber",
    		substance: "rebis",
    		rarity: "P",
    		location: [
    			"Fields"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "17"
    	},
    	{
    		name: "Hag Teeth",
    		substance: "rebis",
    		rarity: "R",
    		location: [
    			"Grave Hags"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "90"
    	},
    	{
    		name: "Lunar Shards",
    		substance: "rebis",
    		rarity: "R",
    		location: [
    			"Mountains",
    			"Underground"
    		],
    		quantity: "1d6/2 Units",
    		forage: "18",
    		weight: ".1",
    		cost: "91"
    	},
    	{
    		name: "Nekker Heart",
    		substance: "rebis",
    		rarity: "P",
    		location: [
    			"Nekkers"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".5",
    		cost: "30"
    	},
    	{
    		name: "Wine Stone",
    		substance: "rebis",
    		rarity: "R",
    		location: [
    			"Breweries"
    		],
    		quantity: "1d6/2 Units",
    		forage: "18",
    		weight: ".5",
    		cost: "88"
    	},
    	{
    		name: "Balisse Leaves",
    		substance: "quebrith",
    		rarity: "C",
    		location: [
    			"Fields"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "8"
    	},
    	{
    		name: "Ducal Water",
    		substance: "quebrith",
    		rarity: "C",
    		location: [
    			"Mountains",
    			"Underground"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "20"
    	},
    	{
    		name: "Fool’s Parsley",
    		substance: "quebrith",
    		rarity: "E",
    		location: [
    			"Fields"
    		],
    		quantity: "2d6 Units",
    		forage: "10",
    		weight: ".1",
    		cost: "2"
    	},
    	{
    		name: "Ghoul Marrow",
    		substance: "quebrith",
    		rarity: "R",
    		location: [
    			"Ghouls"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".5",
    		cost: "80"
    	},
    	{
    		name: "Honeysuckle",
    		substance: "quebrith",
    		rarity: "C",
    		location: [
    			"Fields"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "21"
    	},
    	{
    		name: "Optima Mater",
    		substance: "quebrith",
    		rarity: "R",
    		location: [
    			"Mountains",
    			"Underground"
    		],
    		quantity: "1d6/2 Units",
    		forage: "18",
    		weight: ".1",
    		cost: "100"
    	},
    	{
    		name: "Sulfur",
    		substance: "quebrith",
    		rarity: "C",
    		location: [
    			"Mountains",
    			"Underground"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "14"
    	},
    	{
    		name: "Cortinarius",
    		substance: "hydragenum",
    		rarity: "P",
    		location: [
    			"Forests"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "18"
    	},
    	{
    		name: "Essence of Water",
    		substance: "hydragenum",
    		rarity: "R",
    		location: [
    			"Drowners",
    			"Sirens"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "46"
    	},
    	{
    		name: "Infused Dust",
    		substance: "hydragenum",
    		rarity: "R",
    		location: [
    			"Wraiths",
    			"Noon Wraiths",
    			"Griffins",
    			"Golems"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "146"
    	},
    	{
    		name: "Mistletoe",
    		substance: "hydragenum",
    		rarity: "P",
    		location: [
    			"Fields",
    			"Forests"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "8"
    	},
    	{
    		name: "Nekker Claw",
    		substance: "hydragenum",
    		rarity: "P",
    		location: [
    			"Nekkers"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".5",
    		cost: "40"
    	},
    	{
    		name: "Troll Liver",
    		substance: "hydragenum",
    		rarity: "R",
    		location: [
    			"Rock Trolls"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: "1",
    		cost: "87"
    	},
    	{
    		name: "Werewolf Saliva",
    		substance: "hydragenum",
    		rarity: "R",
    		location: [
    			"Werewolves"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "60"
    	},
    	{
    		name: "Chitin",
    		substance: "vermilion",
    		rarity: "R",
    		location: [
    			"Arachasae",
    			"Endrega"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: "5",
    		cost: "106"
    	},
    	{
    		name: "Endrega Saliva",
    		substance: "vermilion",
    		rarity: "P",
    		location: [
    			"Endrega"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "38"
    	},
    	{
    		name: "Griffin Egg",
    		substance: "vermilion",
    		rarity: "R",
    		location: [
    			"Griffins",
    			"Griffin Nests"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: "1",
    		cost: "150"
    	},
    	{
    		name: "Griffin Feathers",
    		substance: "vermilion",
    		rarity: "R",
    		location: [
    			"Griffins"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "148"
    	},
    	{
    		name: "Mandrake Root",
    		substance: "vermilion",
    		rarity: "R",
    		location: [
    			"Fields",
    			"Forests"
    		],
    		quantity: "1d6/2 Units",
    		forage: "18",
    		weight: ".1",
    		cost: "65"
    	},
    	{
    		name: "Phosphorus",
    		substance: "vermilion",
    		rarity: "P",
    		location: [
    			"Mountains",
    			"Underground"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".5",
    		cost: "20"
    	},
    	{
    		name: "Wolfsbane",
    		substance: "vermilion",
    		rarity: "P",
    		location: [
    			"Fields",
    			"Forests",
    			"Mountains"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "9"
    	},
    	{
    		name: "Fiend’s Eye",
    		substance: "sol",
    		rarity: "R",
    		location: [
    			"Fiends"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".5",
    		cost: "149"
    	},
    	{
    		name: "Light Essence",
    		substance: "sol",
    		rarity: "P",
    		location: [
    			"Noon Wraiths"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "43"
    	},
    	{
    		name: "Siren Vocal Chords",
    		substance: "sol",
    		rarity: "R",
    		location: [
    			"Sirens"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "65"
    	},
    	{
    		name: "Vampire Saliva",
    		substance: "sol",
    		rarity: "R",
    		location: [
    			"Katakans"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".5",
    		cost: "155"
    	},
    	{
    		name: "Verbena",
    		substance: "sol",
    		rarity: "P",
    		location: [
    			"Fields"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "18"
    	},
    	{
    		name: "Wolf’s Aloe Leaves",
    		substance: "sol",
    		rarity: "P",
    		location: [
    			"The Blue Mountains"
    		],
    		quantity: "1d6 Units",
    		forage: "15",
    		weight: ".1",
    		cost: "39"
    	},
    	{
    		name: "Wyvern Eyes",
    		substance: "sol",
    		rarity: "R",
    		location: [
    			"Wyverns"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "75"
    	},
    	{
    		name: "Arachas Venom",
    		substance: "caelum",
    		rarity: "R",
    		location: [
    			"Arachasae"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".5",
    		cost: "76"
    	},
    	{
    		name: "Bryonia",
    		substance: "caelum",
    		rarity: "C",
    		location: [
    			"Mountains",
    			"Cities"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "8"
    	},
    	{
    		name: "Drowner Tongue",
    		substance: "caelum",
    		rarity: "R",
    		location: [
    			"Drowners"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".5",
    		cost: "86"
    	},
    	{
    		name: "Fiend Dung",
    		substance: "caelum",
    		rarity: "R",
    		location: [
    			"Fiend Territory",
    			"Fiends"
    		],
    		quantity: "1d6/2 Units",
    		forage: "20",
    		weight: "1",
    		cost: "106"
    	},
    	{
    		name: "Grave Hag Tongue",
    		substance: "caelum",
    		rarity: "R",
    		location: [
    			"Grave Hags"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".5",
    		cost: "80"
    	},
    	{
    		name: "Green Mold",
    		substance: "caelum",
    		rarity: "C",
    		location: [
    			"Caves"
    		],
    		quantity: "1d10 Units",
    		forage: "12",
    		weight: ".1",
    		cost: "8"
    	},
    	{
    		name: "Vampire Teeth",
    		substance: "caelum",
    		rarity: "R",
    		location: [
    			"Katakans"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "150"
    	},
    	{
    		name: "Venom Extract",
    		substance: "caelum",
    		rarity: "P",
    		location: [
    			"Ghouls",
    			"Grave Hags",
    			"Endrega",
    			"Arachasae",
    			"Wyverns"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "38"
    	},
    	{
    		name: "Arachas Eyes",
    		substance: "fulgur",
    		rarity: "R",
    		location: [
    			"Arachasae"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".5",
    		cost: "95"
    	},
    	{
    		name: "Dog Tallow",
    		substance: "fulgur",
    		rarity: "C",
    		location: [
    			"Dogs",
    			"Wolves"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "10"
    	},
    	{
    		name: "Dwarven Immortelle",
    		substance: "fulgur",
    		rarity: "R",
    		location: [
    			"Underground"
    		],
    		quantity: "1d6/2 Units",
    		forage: "18",
    		weight: ".1",
    		cost: "75"
    	},
    	{
    		name: "Endrega Embryo",
    		substance: "fulgur",
    		rarity: "R",
    		location: [
    			"Endrega Nests"
    		],
    		quantity: "1d6",
    		forage: "N/A",
    		weight: "1.5",
    		cost: "55"
    	},
    	{
    		name: "Golem Heart",
    		substance: "fulgur",
    		rarity: "R",
    		location: [
    			"Golems"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: "1",
    		cost: "167"
    	},
    	{
    		name: "Grave Hag Ear",
    		substance: "fulgur",
    		rarity: "R",
    		location: [
    			"Grave Hags"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: ".1",
    		cost: "134"
    	},
    	{
    		name: "Specter Dust",
    		substance: "fulgur",
    		rarity: "P",
    		location: [
    			"Wraiths"
    		],
    		quantity: "1d6 Units",
    		forage: "N/A",
    		weight: "N/A",
    		cost: "30"
    	},
    	{
    		name: "Wyvern Egg",
    		substance: "fulgur",
    		rarity: "R",
    		location: [
    			"Wyverns"
    		],
    		quantity: "N/A",
    		forage: "N/A",
    		weight: "2",
    		cost: "150"
    	}
    ];

    /* src/App.svelte generated by Svelte v3.21.0 */

    const { Object: Object_1 } = globals;
    const file$3 = "src/App.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (72:10) {:else}
    function create_else_block$1(ctx) {
    	let a;
    	let t_value = /*page*/ ctx[12][1] + "";
    	let t;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[5](/*page*/ ctx[12], ...args);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "nav-link");
    			attr_dev(a, "href", "#");
    			add_location(a, file$3, 72, 12, 2081);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    			if (remount) dispose();
    			dispose = listen_dev(a, "click", click_handler_1, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(72:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (70:10) {#if activePage == page[0]}
    function create_if_block_2(ctx) {
    	let a;
    	let t_value = /*page*/ ctx[12][1] + "";
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[4](/*page*/ ctx[12], ...args);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "nav-link active");
    			attr_dev(a, "href", "#");
    			add_location(a, file$3, 70, 12, 1964);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    			if (remount) dispose();
    			dispose = listen_dev(a, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(70:10) {#if activePage == page[0]}",
    		ctx
    	});

    	return block;
    }

    // (68:8) {#each pages as page }
    function create_each_block_2(ctx) {
    	let li;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*activePage*/ ctx[1] == /*page*/ ctx[12][0]) return create_if_block_2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if_block.c();
    			t = space();
    			attr_dev(li, "class", "nav-item");
    			add_location(li, file$3, 68, 8, 1892);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			if_block.m(li, null);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(li, t);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(68:8) {#each pages as page }",
    		ctx
    	});

    	return block;
    }

    // (88:49) 
    function create_if_block_1$1(ctx) {
    	let div1;
    	let div0;
    	let table;
    	let tr;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let th4;
    	let t9;
    	let th5;
    	let t11;
    	let th6;
    	let t13;
    	let th7;
    	let t15;
    	let current;
    	let each_value_1 = filterItems(/*search*/ ctx[0], alchemicalSubstances);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Name";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Component";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Location";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Rarity";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "Quantity";
    			t9 = space();
    			th5 = element("th");
    			th5.textContent = "Forage DC";
    			t11 = space();
    			th6 = element("th");
    			th6.textContent = "Weight";
    			t13 = space();
    			th7 = element("th");
    			th7.textContent = "Cost";
    			t15 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(th0, file$3, 92, 12, 2617);
    			add_location(th1, file$3, 93, 12, 2643);
    			add_location(th2, file$3, 94, 12, 2674);
    			add_location(th3, file$3, 95, 12, 2704);
    			add_location(th4, file$3, 96, 12, 2732);
    			add_location(th5, file$3, 97, 12, 2762);
    			add_location(th6, file$3, 98, 12, 2793);
    			add_location(th7, file$3, 99, 12, 2821);
    			add_location(tr, file$3, 91, 10, 2600);
    			attr_dev(table, "class", "table table-sm");
    			add_location(table, file$3, 90, 8, 2559);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$3, 89, 6, 2533);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$3, 88, 4, 2509);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, table);
    			append_dev(table, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(tr, t5);
    			append_dev(tr, th3);
    			append_dev(tr, t7);
    			append_dev(tr, th4);
    			append_dev(tr, t9);
    			append_dev(tr, th5);
    			append_dev(tr, t11);
    			append_dev(tr, th6);
    			append_dev(tr, t13);
    			append_dev(tr, th7);
    			append_dev(table, t15);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filterItems, search, alchemicalSubstances*/ 1) {
    				each_value_1 = filterItems(/*search*/ ctx[0], alchemicalSubstances);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(table, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(88:49) ",
    		ctx
    	});

    	return block;
    }

    // (80:2) {#if activePage == "alchemicalItems" }
    function create_if_block$2(ctx) {
    	let div1;
    	let div0;
    	let current;
    	let each_value = filterItems(/*search*/ ctx[0], alchemicalItems);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "col");
    			add_location(div0, file$3, 81, 6, 2308);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$3, 80, 4, 2284);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filterItems, search, alchemicalItems*/ 1) {
    				each_value = filterItems(/*search*/ ctx[0], alchemicalItems);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(80:2) {#if activePage == \\\"alchemicalItems\\\" }",
    		ctx
    	});

    	return block;
    }

    // (102:8) {#each filterItems( search, alchemicalSubstances ) as substance}
    function create_each_block_1(ctx) {
    	let current;

    	const substance = new Substance({
    			props: { substance: /*substance*/ ctx[9] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(substance.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(substance, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const substance_changes = {};
    			if (dirty & /*search*/ 1) substance_changes.substance = /*substance*/ ctx[9];
    			substance.$set(substance_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(substance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(substance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(substance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(102:8) {#each filterItems( search, alchemicalSubstances ) as substance}",
    		ctx
    	});

    	return block;
    }

    // (83:8) {#each filterItems( search, alchemicalItems) as obj}
    function create_each_block$2(ctx) {
    	let current;

    	const card = new Card({
    			props: { obj: /*obj*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};
    			if (dirty & /*search*/ 1) card_changes.obj = /*obj*/ ctx[6];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(83:8) {#each filterItems( search, alchemicalItems) as obj}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let link0;
    	let script;
    	let script_src_value;
    	let link1;
    	let t0;
    	let div5;
    	let div2;
    	let div0;
    	let t2;
    	let div1;
    	let input;
    	let t3;
    	let div4;
    	let div3;
    	let ul;
    	let t4;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let dispose;
    	let each_value_2 = /*pages*/ ctx[2];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const if_block_creators = [create_if_block$2, create_if_block_1$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*activePage*/ ctx[1] == "alchemicalItems") return 0;
    		if (/*activePage*/ ctx[1] == "alchemicalSubstances") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			script = element("script");
    			link1 = element("link");
    			t0 = space();
    			div5 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Search:";
    			t2 = space();
    			div1 = element("div");
    			input = element("input");
    			t3 = space();
    			div4 = element("div");
    			div3 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			if (if_block) if_block.c();
    			attr_dev(link0, "rel", "stylesheet");
    			attr_dev(link0, "href", "https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css");
    			attr_dev(link0, "integrity", "sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T");
    			attr_dev(link0, "crossorigin", "anonymous");
    			add_location(link0, file$3, 35, 1, 993);
    			script.defer = true;
    			if (script.src !== (script_src_value = "https://use.fontawesome.com/releases/v5.0.6/js/all.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file$3, 39, 1, 1230);
    			attr_dev(link1, "rel", "icon");
    			attr_dev(link1, "href", "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/microsoft/209/wolf-face_1f43a.png");
    			add_location(link1, file$3, 42, 1, 1339);
    			document.title = "Witcher completor";
    			attr_dev(div0, "class", "col-1");
    			add_location(div0, file$3, 57, 4, 1627);
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$3, 61, 6, 1700);
    			attr_dev(div1, "class", "col");
    			add_location(div1, file$3, 60, 4, 1676);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$3, 56, 2, 1605);
    			attr_dev(ul, "class", "nav nav-tabs");
    			add_location(ul, file$3, 66, 6, 1827);
    			attr_dev(div3, "class", "col");
    			add_location(div3, file$3, 65, 4, 1803);
    			attr_dev(div4, "class", "row top-room svelte-19bp6ok");
    			add_location(div4, file$3, 64, 2, 1772);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$3, 55, 0, 1579);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, link0);
    			append_dev(document.head, script);
    			append_dev(document.head, link1);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*search*/ ctx[0]);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div5, t4);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div5, null);
    			}

    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[3]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*search*/ 1 && input.value !== /*search*/ ctx[0]) {
    				set_input_value(input, /*search*/ ctx[0]);
    			}

    			if (dirty & /*activePage, pages*/ 6) {
    				each_value_2 = /*pages*/ ctx[2];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div5, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link0);
    			detach_dev(script);
    			detach_dev(link1);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function itemMatch(match, item) {
    	let m = match.toLowerCase();

    	for (let [key, value] of Object.entries(item)) {
    		if (typeof value == "string" && value.toLowerCase().includes(m)) {
    			return true;
    		} else if (Array.isArray(value) && value.some(elt => elt.toLowerCase().includes(m))) {
    			return true;
    		}
    	}

    	return false;
    }

    function filterItems(filterVal, alchemicalItems) {
    	return alchemicalItems.filter(item => itemMatch(filterVal, item));
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let search = "";

    	let pages = [
    		["alchemicalItems", "Alchemical Items"],
    		["alchemicalSubstances", "Alchemical Substances"]
    	];

    	let activePage = "alchemicalItems";
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input_input_handler() {
    		search = this.value;
    		$$invalidate(0, search);
    	}

    	const click_handler = page => $$invalidate(1, activePage = page[0]);
    	const click_handler_1 = page => $$invalidate(1, activePage = page[0]);

    	$$self.$capture_state = () => ({
    		Card,
    		Substance,
    		alchemicalItems,
    		alchemicalSubstances,
    		search,
    		itemMatch,
    		filterItems,
    		pages,
    		activePage
    	});

    	$$self.$inject_state = $$props => {
    		if ("search" in $$props) $$invalidate(0, search = $$props.search);
    		if ("pages" in $$props) $$invalidate(2, pages = $$props.pages);
    		if ("activePage" in $$props) $$invalidate(1, activePage = $$props.activePage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [search, activePage, pages, input_input_handler, click_handler, click_handler_1];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
