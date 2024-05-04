import archiver from 'archiver';
import fs from 'fs';
import { woodPlanks, isomorphisms, existingRecipes } from './items.js';

function fillTemplate(template, data) {
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

// Templates.
const advancementTemplate = fs.readFileSync('templates/advancements.txt', 'utf8');
const recipeTemplate = fs.readFileSync('templates/recipes.txt', 'utf8');

// Set up wooden slabs.
woodPlanks.forEach(([name, suffix]) => {
    const plankName = suffix.length === 0 ? name : `${name}_${suffix}`;
    const advancement = fillTemplate(advancementTemplate, { item: plankName, recipe: `${name}_slab_from_${plankName}_stonecutting.json` });
    const recipe = fillTemplate(recipeTemplate, { item: plankName, result: `${name}_slab`, count: '2' });

    archive.append(advancement, { name: `data/extracutter/advancements/recipes/building_blocks/${name}_slab_from_${plankName}_stonecutting.json` });
    archive.append(recipe, { name: `data/extracutter/recipes/${name}_slab_from_${plankName}_stonecutting.json` });
});

// Set up isomorphisms.
isomorphisms.forEach(isomorphism => {
    isomorphism.forEach(itemA => {
        isomorphism.forEach(itemB => {
            if (itemA === itemB || existingRecipes.some(([input, outpit]) => input === itemA && outpit === itemB)) {
                return;
            }
            const recipe = fillTemplate(recipeTemplate, { item: itemA, result: itemB, count: '1' });
            archive.append(recipe, { name: `data/extracutter/recipes/${itemB}_from_${itemA}_stonecutting.json` });
        });
    });
});

archive.finalize();
