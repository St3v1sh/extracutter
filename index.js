import archiver from 'archiver';
import fs from 'fs';
import { woodPlanks, isomorphisms, existingRecipes } from './items.js';

function fillTemplate(template, data) {
    return Object.keys(data).reduce((accumulator, keyword) => accumulator.replace(new RegExp(`{{${keyword}}}`, 'g'), data[keyword]), template);
}

function buildRewardList(rewards) {
    return rewards.map(reward => `"extracutter:${reward}"`).join(', ');
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

// Set up wooden slab recipes.
woodPlanks.forEach(([name, suffix]) => {
    const plankName = suffix.length === 0 ? name : `${name}_${suffix}`;
    const recipeFile = `${name}_slab_from_${plankName}_extracutter.json`;
    const advancement = fillTemplate(advancementTemplate, { item: plankName, recipes: buildRewardList([recipeFile]) });
    const recipe = fillTemplate(recipeTemplate, { item: plankName, result: `${name}_slab`, count: '2' });

    archive.append(advancement, { name: `data/extracutter/advancements/recipes/building_blocks/${recipeFile}` });
    archive.append(recipe, { name: `data/extracutter/recipes/${recipeFile}` });
});

// Set up isomorphisms.
isomorphisms.forEach(isomorphism => {
    isomorphism.forEach(itemA => {
        // Advancements.
        const recipeFiles = isomorphism
            .map(itemB => `${itemB}_from_${itemA}_extracutter.json`)
            .filter(recipeFile => recipeFile !== `${itemA}_from_${itemA}_extracutter.json` && !existingRecipes
                .some(([input, output]) => recipeFile === `${output}_from_${input}_extracutter.json`));
        if (recipeFiles.length > 0) {
            const advancement = fillTemplate(advancementTemplate, { item: itemA, recipes: buildRewardList(recipeFiles) });
            archive.append(advancement, { name: `data/extracutter/advancements/recipes/building_blocks/${itemA}_extracutter.json` });
        }

        // Recipes.
        isomorphism.forEach(itemB => {
            if (itemA === itemB || existingRecipes.some(([input, outpit]) => input === itemA && outpit === itemB)) {
                return;
            }
            const recipe = fillTemplate(recipeTemplate, { item: itemA, result: itemB, count: '1' });
            archive.append(recipe, { name: `data/extracutter/recipes/${itemB}_from_${itemA}_extracutter.json` });
        });
    });
});

archive.finalize();
