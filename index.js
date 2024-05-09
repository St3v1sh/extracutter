import archiver from 'archiver';
import fs from 'fs';
import { woods, isomorphisms, existingRecipes } from './items.js';

function fillTemplate(template, data) {
    if (data['id_type'] === undefined) {
        data['id_type'] = 'item';
    }
    return Object.keys(data).reduce((accumulator, keyword) => accumulator.replace(new RegExp(`{{${keyword}}}`, 'g'), data[keyword]), template);
}

const output = fs.createWriteStream('extracutter.zip');
const archive = archiver('zip', {
    zlib: { level: 9 }
})

output.on('close', () => {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.on('error', err => {
    throw err;
});

archive.pipe(output);

// Set up mcmeta.
archive.file('templates/pack.mcmeta', { name: 'pack.mcmeta' });

// Template.
const advancementTemplate = fs.readFileSync('templates/advancements.txt', 'utf8');
const recipeTemplate = fs.readFileSync('templates/recipes.txt', 'utf8');

// Set up wood recipes.
woods.forEach(([name, logSuffix, plankSuffix]) => {
    const plankName = plankSuffix.length === 0 ? name : `${name}_${plankSuffix}`;
    if (logSuffix.length > 0) {
        // Set up log to planks recipes.
        const logName = `${name}_${logSuffix}`;
        const toPlanksRecipeFile = `${plankName}_from_${logName}_extracutter`;
        const toPlanksAdvancement = fillTemplate(advancementTemplate, { id_type: 'tag', item: logName, recipe: toPlanksRecipeFile });
        const toPlanksRecipe = fillTemplate(recipeTemplate, { id_type: 'tag', item: logName, result: plankName, count: name === 'bamboo' ? '2' : '4' });

        archive.append(toPlanksAdvancement, { name: `data/extracutter/advancements/recipes/building_blocks/${toPlanksRecipeFile}.json` });
        archive.append(toPlanksRecipe, { name: `data/extracutter/recipes/${toPlanksRecipeFile}.json` });

        // Set up log to slab recipes.
        const toSlabsRecipeFile = `${name}_slab_from_${logName}_extracutter`;
        const toSlabsAdvancement = fillTemplate(advancementTemplate, { id_type: 'tag', item: logName, recipe: toSlabsRecipeFile });
        const toSlabsRecipe = fillTemplate(recipeTemplate, { id_type: 'tag', item: logName, result: `${name}_slab`, count: name === 'bamboo' ? '4' : '8' });

        archive.append(toSlabsAdvancement, { name: `data/extracutter/advancements/recipes/building_blocks/${toSlabsRecipeFile}.json` });
        archive.append(toSlabsRecipe, { name: `data/extracutter/recipes/${toSlabsRecipeFile}.json` });

        // Set up log to stair recipes.
        const toStairsRecipeFile = `${name}_stairs_from_${logName}_extracutter`;
        const toStairsAdvancement = fillTemplate(advancementTemplate, { id_type: 'tag', item: logName, recipe: toStairsRecipeFile });
        const toStairsRecipe = fillTemplate(recipeTemplate, { id_type: 'tag', item: logName, result: `${name}_stairs`, count: name === 'bamboo' ? '2' : '4' });

        archive.append(toStairsAdvancement, { name: `data/extracutter/advancements/recipes/building_blocks/${toStairsRecipeFile}.json` });
        archive.append(toStairsRecipe, { name: `data/extracutter/recipes/${toStairsRecipeFile}.json` });
    }

    // Set up plank to slab recipes.
    const recipeFile = `${name}_slab_from_${plankName}_extracutter`;
    const advancement = fillTemplate(advancementTemplate, { item: plankName, recipe: recipeFile });
    const recipe = fillTemplate(recipeTemplate, { item: plankName, result: `${name}_slab`, count: '2' });

    archive.append(advancement, { name: `data/extracutter/advancements/recipes/building_blocks/${recipeFile}.json` });
    archive.append(recipe, { name: `data/extracutter/recipes/${recipeFile}.json` });
});

// Set up isomorphisms.
isomorphisms.forEach(isomorphism => {
    isomorphism.forEach(itemA => {
        isomorphism.forEach(itemB => {
            if (itemA === itemB || existingRecipes.some(([input, outpit]) => input === itemA && outpit === itemB)) {
                return;
            }

            const recipeFile = `${itemB}_from_${itemA}_extracutter`;
            const advancement = fillTemplate(advancementTemplate, { item: itemA, recipe: recipeFile });
            const recipe = fillTemplate(recipeTemplate, { item: itemA, result: itemB, count: '1' });

            archive.append(advancement, { name: `data/extracutter/advancements/recipes/building_blocks/${recipeFile}.json` });
            archive.append(recipe, { name: `data/extracutter/recipes/${recipeFile}.json` });
        });
    });
});

// Set up special cases.
const bambooLogName = 'bamboo_blocks';

// Bamboo block to bamboo mosaic.
const toBambooMosaicRecipeFile = `bamboo_mosaic_from_${bambooLogName}_extracutter`;
const toBambooMosaicAdvancement = fillTemplate(advancementTemplate, { id_type: 'tag', item: bambooLogName, recipe: toBambooMosaicRecipeFile });
const toBambooMosaicRecipe = fillTemplate(recipeTemplate, { id_type: 'tag', item: bambooLogName, result: 'bamboo_mosaic', count: '2' });

archive.append(toBambooMosaicAdvancement, { name: `data/extracutter/advancements/recipes/building_blocks/${toBambooMosaicRecipeFile}.json` });
archive.append(toBambooMosaicRecipe, { name: `data/extracutter/recipes/${toBambooMosaicRecipeFile}.json` });

// Bamboo block to bamboo mosaic stairs.
const toBambooMosaicStairsRecipeFile = `bamboo_mosaic_stairs_from_${bambooLogName}_extracutter`;
const toBambooMosaicStairsAdvancement = fillTemplate(advancementTemplate, { id_type: 'tag', item: bambooLogName, recipe: toBambooMosaicStairsRecipeFile });
const toBambooMosaicStairsRecipe = fillTemplate(recipeTemplate, { id_type: 'tag', item: bambooLogName, result: 'bamboo_mosaic_stairs', count: '2' });

archive.append(toBambooMosaicStairsAdvancement, { name: `data/extracutter/advancements/recipes/building_blocks/${toBambooMosaicStairsRecipeFile}.json` });
archive.append(toBambooMosaicStairsRecipe, { name: `data/extracutter/recipes/${toBambooMosaicStairsRecipeFile}.json` });

// Bamboo block to bamboo mosaic slab.
const toBambooMosaicSlabRecipeFile = `bamboo_mosaic_slab_from_${bambooLogName}_extracutter`;
const toBambooMosaicSlabAdvancement = fillTemplate(advancementTemplate, { id_type: 'tag', item: bambooLogName, recipe: toBambooMosaicSlabRecipeFile });
const toBambooMosaicSlabRecipe = fillTemplate(recipeTemplate, { id_type: 'tag', item: bambooLogName, result: 'bamboo_mosaic_slab', count: '4' });

archive.append(toBambooMosaicSlabAdvancement, { name: `data/extracutter/advancements/recipes/building_blocks/${toBambooMosaicSlabRecipeFile}.json` });
archive.append(toBambooMosaicSlabRecipe, { name: `data/extracutter/recipes/${toBambooMosaicSlabRecipeFile}.json` });

// Finalize.
archive.finalize();
