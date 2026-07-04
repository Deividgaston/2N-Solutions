const projectId = 'nsoluciones-68554';
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const verticals = ['bts', 'btr', 'office', 'hotel', 'security'];

async function fetchAll(verticalId, subcoll) {
    const url = `${baseUrl}/verticals/${verticalId}/${subcoll}`;
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        return json.documents || [];
    } catch (e) {
        console.log(e);
        return [];
    }
}

async function deleteDoc(docName) {
    try {
        await fetch(`https://firestore.googleapis.com/v1/${docName}`, { method: 'DELETE' });
        console.log('Deleted duplicate:', docName);
    } catch (e) {
        console.log(e);
    }
}

(async () => {
    for (const vert of verticals) {
        // Tech Cards (Check duplicate label/name)
        const tech = await fetchAll(vert, 'tech_cards');
        let techSeen = new Set();
        for (const doc of tech) {
            const name = doc.fields.name?.stringValue || doc.fields.label?.stringValue;
            if (techSeen.has(name)) await deleteDoc(doc.name);
            else techSeen.add(name);
        }

        // Cases (Check duplicate name)
        const cases = await fetchAll(vert, 'cases');
        let caseSeen = new Set();
        for (const doc of cases) {
            const name = doc.fields.name?.stringValue;
            if (caseSeen.has(name)) await deleteDoc(doc.name);
            else caseSeen.add(name);
        }

        // Sections (Check duplicate title)
        const sections = await fetchAll(vert, 'sections');
        let secSeen = new Set();
        for (const doc of sections) {
            const title = doc.fields.title?.stringValue;
            if (secSeen.has(title)) await deleteDoc(doc.name);
            else secSeen.add(title);
        }
    }
    console.log("Cleanup Duplicates Complete!");
})();
