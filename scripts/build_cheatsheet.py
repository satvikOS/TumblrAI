"""Build a 2-side A4 Social Media Analytics final-exam cheat sheet PDF.

One A4 sheet, front + back. Densest possible without losing readability.
Sources: lecture decks S1-S13 + Review Text + Review SNA & Web (repo root).
Output: docs/social_media_analytics_cheatsheet.pdf.
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    FrameBreak,
    PageBreak,
    PageTemplate,
    Paragraph,
    Table,
    TableStyle,
)


OUT_PATH = Path(__file__).resolve().parent.parent / "docs" / "social_media_analytics_cheatsheet.pdf"

NAVY = HexColor("#0B2545")
INK = HexColor("#13315C")
ACCENT = HexColor("#8DA9C4")
HILITE = HexColor("#F5C518")
SOFT = HexColor("#EEF4FB")
CODE_BG = HexColor("#F4F1EA")
CODE_FG = HexColor("#2A2118")
RULE = HexColor("#C9D6E2")
TAG_TEXT = HexColor("#7B2D26")
TAG_DL = HexColor("#1B5E20")
TAG_WEB = HexColor("#4A148C")
TAG_SNA = HexColor("#0D47A1")


def make_styles() -> dict[str, ParagraphStyle]:
    base = ParagraphStyle(
        "base", fontName="Helvetica", fontSize=6.0, leading=7.0,
        textColor=INK, spaceAfter=0,
    )
    return {
        "section": ParagraphStyle(
            "section", parent=base, fontName="Helvetica-Bold",
            fontSize=7.6, leading=8.6, textColor=colors.white, backColor=NAVY,
            borderPadding=(1.5, 3, 1.5, 3), spaceBefore=2.5, spaceAfter=1.2,
        ),
        "h": ParagraphStyle(
            "h", parent=base, fontName="Helvetica-Bold", fontSize=6.6,
            leading=7.6, textColor=NAVY, spaceBefore=1.2, spaceAfter=0.4,
        ),
        "body": base,
        "tip": ParagraphStyle(
            "tip", parent=base, fontName="Helvetica-Oblique", fontSize=5.8,
            leading=6.8, textColor=TAG_TEXT,
        ),
        "code": ParagraphStyle(
            "code", parent=base, fontName="Courier", fontSize=5.5,
            leading=6.4, textColor=CODE_FG, backColor=CODE_BG,
            borderPadding=(1.5, 2.5, 1.5, 2.5), spaceBefore=0.6, spaceAfter=0.6,
        ),
    }


S = make_styles()


def section(title: str, color=NAVY):
    return Paragraph(title.upper(), ParagraphStyle(
        f"sec_{title}", parent=S["section"], backColor=color))


def p(text: str):
    return Paragraph(text, S["body"])


def tip(text: str):
    return Paragraph("&#9758; " + text, S["tip"])


def code(text: str):
    safe = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    safe = safe.replace("\n", "<br/>")
    return Paragraph(safe, S["code"])


def kv(rows, col_widths):
    tbl = Table(rows, colWidths=col_widths, hAlign="LEFT")
    tbl.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 5.9),
        ("LEADING", (0, 0), (-1, -1), 6.9),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0.6),
        ("TOPPADDING", (0, 0), (-1, -1), 0.6),
        ("LEFTPADDING", (0, 0), (-1, -1), 1.8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 1.8),
        ("BACKGROUND", (0, 0), (-1, 0), SOFT),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 6.0),
        ("TEXTCOLOR", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 0.4, RULE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, HexColor("#FBFCFE")]),
    ]))
    return tbl


# ============================================================
# CONTENT — every line carries information
# ============================================================


def page1_left() -> list:
    f: list = []

    f.append(section("1 · Pipeline + BoW", TAG_TEXT))
    f.append(p("<b>tokenize → normalize (stem/lemma/stop-word/min_df) → vectorize (BoW or TF-IDF) → model</b>"))
    f.append(kv([
        ["Concept", "Definition"],
        ["Tokenize", "Split text into tokens. Always step #1."],
        ["BoW", "Vector of word counts. <b>Loses order.</b>"],
        ["Term-Doc Matrix", "Rows=docs, cols=terms, cells=freq/binary."],
        ["Stem", "Suffix chop, no dict: 'running'→'run'."],
        ["Lemmatize", "Dict base form: 'feet'→'foot', 'better'→'good'."],
        ["Stop-word", "Drop 'is','the','a' (low info)."],
        ["min_df filter", "Drop rare tokens (don't generalize)."],
    ], [16 * mm, 47 * mm]))

    f.append(section("2 · TF-IDF · N-gram · POS", TAG_TEXT))
    f.append(p("<b>TF·IDF = (k/n) · log(N/df)</b>. k=term count in doc, n=#terms in doc, N=corpus, df=docs containing term."))
    f.append(tip("1000 docs, doc has 25 terms, 'unstructured' appears 3× and in ⅕ of docs (df=200) → <b>(3·log 5)/25</b>."))
    f.append(p("<b>n-grams</b> capture local order: 'not good'≠'good'. Sentence with W tokens → <b>W−1 bi-grams</b>, <b>W−2 tri-grams</b>. Ex: 'Social media generates lots of unstructured data' (7) → <b>6 bi-grams</b>."))
    f.append(p("<b>POS</b> labels noun/verb/etc; preserves sentence-level partial order. Higher n + POS ⇒ very high-dim sparse matrix."))
    f.append(code(
        "from sklearn.feature_extraction.text import TfidfVectorizer\n"
        "vec = TfidfVectorizer(ngram_range=(1,2), min_df=2)\n"
        "X = vec.fit_transform(corpus)\n"
        "from nltk import pos_tag, word_tokenize\n"
        "pos_tag(word_tokenize(text))   # [(word, tag), ...]"
    ))

    f.append(section("3 · Similarity · Clustering · LDA", TAG_TEXT))
    f.append(kv([
        ["Method", "Note"],
        ["Cosine sim", "<b>angle</b> between vectors; ignores length. Default for text."],
        ["Jaccard", "|A∩B|/|A∪B| (sets/binary)."],
        ["Overlap", "|A∩B|/min(|A|,|B|)."],
        ["K-Means", "Hard 1-cluster/doc, k centroids. Topic = top words of centroid."],
        ["Agglomerative", "Bottom-up hierarchical merges."],
        ["LDA", "Probabilistic: doc = <b>mixture</b> of topics; topic = distribution of words."],
        ["Cluster vs LDA", "Cluster = 1 cluster/doc; <b>LDA = overlapping topic membership</b>."],
    ], [16 * mm, 47 * mm]))
    f.append(code(
        "from sklearn.cluster import KMeans\n"
        "from sklearn.decomposition import LatentDirichletAllocation as LDA\n"
        "km = KMeans(n_clusters=5).fit(X);  lda = LDA(n_components=5).fit(X)"
    ))

    f.append(section("4 · Sentiment · Logit", TAG_TEXT))
    f.append(p("<b>Sentiment</b> = classify tone (pos/neg/neu). Score = <b>weighted sum</b> of word presence × sentiment weight."))
    f.append(p("<b>VADER</b> = lexicon-based polarity (no training). Adjusts for caps, '!!!', booster/negation, slang. Use <code>sid.polarity_scores(text)</code> → {'neg','neu','pos','compound'}."))
    f.append(p("<b>Logit:</b> P = 1/(1+e<sup>−Xβ</sup>). <b>β = per-word sentiment weights</b> (interpretable). β learned by maximizing log-likelihood on labeled data."))
    f.append(p("<b>Train/test split</b> mandatory ⇒ tests <b>generalization</b>. Without it, accuracy inflated."))
    f.append(p("<b>ROC</b>: TPR vs FPR over thresholds; trades off recall vs false alarms."))
    f.append(code(
        "from sklearn.linear_model import LogisticRegression\n"
        "model.fit(train_x, train_c)\n"
        "y_pred = model.predict(test_x)\n"
        "acc = accuracy_score(test_c, y_pred)   # (true, pred)"
    ))

    f.append(section("5 · Other Classifiers", TAG_TEXT))
    f.append(kv([
        ["Model", "Idea"],
        ["Naive Bayes", "Assumes feature <b>independence</b>; fast, simple baseline."],
        ["SVM", "Max-margin hyperplane; <b>kernels</b> (poly) → non-linear."],
        ["Decision Tree", "Recursive splits; interpretable; overfits."],
        ["Random Forest", "Bag many trees + <b>bootstrap</b> rows/cols → cuts variance/overfit."],
        ["Logit", "Linear, interpretable β/term."],
    ], [16 * mm, 47 * mm]))
    f.append(tip("RF overfits (train≫test) ⇒ <b>raise bootstrap subsampling</b> of features+rows. Don't deepen trees."))
    f.append(p("<b>Fair contest</b>: same train/test data + same features; compare on <b>test accuracy</b>. Overfit when train acc > test acc (model learned noise)."))

    return f


def page1_right() -> list:
    f: list = []

    f.append(section("6 · Neural Networks + Images", TAG_DL))
    f.append(p("<b>Neuron:</b> a = f(Σ wᵢxᵢ + b). <b>Activations:</b> ReLU max(0,x), sigmoid 1/(1+e<sup>−x</sup>). Add non-linearity."))
    f.append(p("<b>vs Logit/SVM:</b> stacks many <b>hidden layers</b> → learns non-linear hierarchical features (low → mid → high)."))
    f.append(p("<b>Param count</b> dominated by <b>1st layer</b> (depends on input size). 400×400×3 input → 1 hidden of 480k ≈ <b>230B params</b>; 1 hidden of 1k ≈ <b>480M</b>. Deep + narrow ≪ shallow + wide for same capacity."))
    f.append(tip("<b>MLPClassifier(hidden_layer_sizes=(2,3))</b> = <b>2 hidden layers</b>: 1st has 2 neurons, 2nd has 3."))
    f.append(p("<b>Image:</b> flatten 2D RGB to vector. 100×200×3 → <b>60000 dims = (60000,1)</b>. Then any classic ML applies."))
    f.append(p("<b>Big nets need big data</b> — DL beats traditional only at large data size; otherwise overfits."))
    f.append(code(
        "from sklearn.neural_network import MLPClassifier\n"
        "DL = MLPClassifier(solver='lbfgs', hidden_layer_sizes=(3,2))\n"
        "DL.fit(train_x, train_c);  acc=accuracy_score(test_c, DL.predict(test_x))"
    ))

    f.append(section("7 · Word Embedding", TAG_DL))
    f.append(kv([
        ["Encoding", "Properties"],
        ["Index", "word→int. <b>Preserves order</b>; no semantics."],
        ["One-hot", "binary vector/word. Orthogonal ⇒ <b>no similarity</b>; sparse."],
        ["BoW", "sum of one-hots; <b>loses order</b>."],
        ["N-gram rep", "Preserves <b>phrase-level</b> local order."],
        ["POS rep", "Preserves order within <b>short sentence</b>."],
        ["W2V / GloVe", "<b>Dense, low-dim</b>; distance ≈ semantic similarity."],
    ], [16 * mm, 47 * mm]))
    f.append(tip("Padded one-hot for K docs, max len L (pad shorter), vocab V → shape <b>(K, L, V)</b>. e.g. 123 docs, max 50, V=4000 → <b>(123, 50, 4000)</b>."))
    f.append(p("<b>Semantic arithmetic:</b> king − man + woman ≈ queen. <b>Pre-trained</b> (Google W2V, Stanford GloVe) = dict {term: vec}; great for small/noisy data."))
    f.append(p("<b>Embedding layer</b> in NN = trainable dense vectors learned during training; standard front-end of LSTM/RNN."))

    f.append(section("8 · RNN + LSTM", TAG_DL))
    f.append(p("<b>Order matters</b> for translation, chatbot, sentiment ⇒ use order-preserving rep (index/one-hot)."))
    f.append(p("<b>RNN:</b> <b>1 unit reused</b> across time-steps; hidden state carries memory. A step is NOT a unit. Param count depends only on per-step input size ⇒ huge savings vs flattened."))
    f.append(p("<b>Vanishing/exploding gradient:</b> backprop through long seq fails ⇒ only later tokens learned. <b>LSTM</b> adds <b>memory cell + input/forget/output gates</b> ⇒ keeps long-range deps; learns earlier tokens too. Built-in attention distribution."))
    f.append(tip("<b>Batch size</b> = #samples before weight update (memory). <b>Epoch</b> = 1 full pass. Need many epochs with batches so early batches re-seen after late batches."))
    f.append(p("<b>Seq2Seq</b>: produces output sequence (translation, chatbot)."))
    f.append(code(
        "model = Sequential([\n"
        "  Embedding(V, 64), LSTM(32),\n"
        "  Dense(1, activation='sigmoid')])\n"
        "model.compile(loss='binary_crossentropy', optimizer='adam',\n"
        "              metrics=['accuracy'])\n"
        "model.fit(X, y, batch_size=64, epochs=10)"
    ))

    f.append(section("KEY QUIZ TRAPS — Text/DL", HILITE))
    f.append(p(
        "<font color='#7B2D26'><b>•</b></font> Term-doc matrix represents <b>word frequencies across docs</b> (not lengths/POS).<br/>"
        "<font color='#7B2D26'><b>•</b></font> Lemmatization = <b>dictionary mapping</b> (not stemming/TF-IDF/n-gram).<br/>"
        "<font color='#7B2D26'><b>•</b></font> Cosine measures <b>angle</b> between vectors (not Jaccard/Euclidean).<br/>"
        "<font color='#7B2D26'><b>•</b></font> LDA improvement: <b>overlapping topic membership</b> per doc (not equal clusters).<br/>"
        "<font color='#7B2D26'><b>•</b></font> accuracy_score args = <b>(test_c, y_pred)</b> = (true, predicted).<br/>"
        "<font color='#7B2D26'><b>•</b></font> Logit β = <b>sentiment weights per term</b> (not tokens/output/embedding).<br/>"
        "<font color='#7B2D26'><b>•</b></font> Embedding > one-hot because <b>semantic similarity preserved</b>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> LSTM solves <b>vanishing gradient</b> (not dim/speed/sparsity).<br/>"
        "<font color='#7B2D26'><b>•</b></font> RF overfit fix: <b>bootstrap aggregating</b> (more random subsample).<br/>"
    ))

    return f


def page2_left() -> list:
    f: list = []

    f.append(section("9 · Web Scrape (Scrapy + XPath)", TAG_WEB))
    f.append(p("<b>HTML</b> = nested tags w/ <b>id</b> (unique) + <b>class</b> (reusable). XPath queries the tree."))
    f.append(kv([
        ["XPath / call", "Meaning"],
        ["//div[@class='c']/a", "<b>Direct</b> &lt;a&gt; children of any div.c"],
        ["//div[@class='c']//a", "All &lt;a&gt; <b>descendants</b> of div.c (any depth)"],
        ["/div[@class='c']/a", "From root only (rarely useful)"],
        [".extract()", "List of all matches"],
        [".extract_first()", "First match or None"],
        ["response.urljoin(rel)", "Convert relative href → absolute"],
    ], [22 * mm, 41 * mm]))
    f.append(p("<b>Wrapper pattern</b> (multi-feature item): grab parent block, loop, pull each child by relative XPath."))
    f.append(code(
        "def parse(self, response):\n"
        "  for w in response.xpath('//div[@class=\"post quote\"]'):\n"
        "    q = w.xpath('span/text()').extract_first()\n"
        "    a = w.xpath('div[@class=\"source\"]/text()').extract_first()\n"
        "    yield {'quote': q, 'author': a}"
    ))
    f.append(p("<b>Pagination</b> (same-type pages): next href → urljoin → <b>yield Request(url, callback=self.parse)</b>."))
    f.append(p("<b>Hierarchical</b> (different page types): multiple parse fns. Pass partial via <code>Request(..., meta={...})</code>; receive in lower fn via <code>response.meta</code>."))
    f.append(code(
        "next_url = response.urljoin(\n"
        "  response.xpath('//div[@id=\"pagination\"]/a/@href').extract()[-1])\n"
        "yield Request(next_url, callback=self.parse)\n"
        "yield Request(detail_url, callback=self.parse_lower,\n"
        "              meta={'Quote': q, 'Author': a})"
    ))
    f.append(tip("Quiz: only <b>yield Request(url=…, callback=self.fn)</b> is correct — capital R, <b>self.</b>, no quotes."))

    f.append(section("10 · Network Basics + Representation", TAG_SNA))
    f.append(p("<b>Network</b>=nodes (vertices) + edges (ties). <b>Undirected</b> (FB friend, kinship) vs <b>Directed</b> (Twitter follow): tail→head."))
    f.append(p("<b>Walk</b>=any edge sequence. <b>Path</b>=no repeat nodes. <b>Cycle</b>=closed path. <b>Geodesic</b>=shortest path; geodesic distance = its length. <b>Component</b>=maximal connected subgraph. <b>Strongly connected</b>=path between every pair (directed)."))
    f.append(kv([
        ["Representation", "Form"],
        ["Adjacency list", "<code>{node: [neighbors]}</code>"],
        ["Adjacency matrix", "N×N binary; symmetric ⇔ undirected"],
        ["Edge list", "<code>[(u,v), …]</code>"],
    ], [22 * mm, 41 * mm]))
    f.append(tip("Max edges: undirected <b>n(n−1)/2</b>, directed <b>n(n−1)</b>. Directed graph has <b>½ density</b> of its undirected version."))
    f.append(code(
        "import networkx as nx\n"
        "G = nx.Graph(adj_list)         # from dict\n"
        "G = nx.from_numpy_array(A)     # from matrix\n"
        "G = nx.Graph(edges)            # from edge list\n"
        "G = nx.read_edgelist('g.edgelist', nodetype=int)"
    ))

    f.append(section("11 · Network Diagnosis (network-level)", TAG_SNA))
    f.append(kv([
        ["Metric", "Formula / meaning"],
        ["Density", "2|E|/(|V|(|V|−1)) undirected; halved for directed."],
        ["Avg degree", "Σ deg(v)/|V|."],
        ["Clustering (transitivity)", "closed triplets / triplets (triangles)."],
        ["Diameter", "<b>max</b> shortest-path; undirected only; K-level→2K."],
        ["Connectivity", "min nodes/edges to disconnect → robustness."],
        ["Reciprocity", "sym edges / total (directed only)."],
        ["Centralization", "spread of centrality across nodes."],
    ], [25 * mm, 38 * mm]))
    f.append(tip("Same density ≠ same speed: <b>clustered edges = local groups</b> (slow spread); dispersed edges spread fast. Same clustering also ≠ same speed."))
    f.append(code(
        "nx.density(G)            nx.transitivity(G)\n"
        "nx.diameter(G)           nx.node_connectivity(G)\n"
        "nx.edge_connectivity(G)  nx.reciprocity(G)\n"
        "# centralization: max c - all c, sum / ((N-1)(N-2))"
    ))

    return f


def page2_right() -> list:
    f: list = []

    f.append(section("12 · Node Centrality (Influencers)", TAG_SNA))
    f.append(kv([
        ["Centrality", "Captures / pick when…"],
        ["Degree", "# direct connections; reach <b>immediate</b> neighbors."],
        ["Closeness", "1/mean geodesic to all; <b>speed of reach</b>."],
        ["Betweenness", "# geodesics through node; <b>broker</b>/gatekeeper; cuts flow."],
        ["Eigenvector", "Connected to <b>other influential</b> nodes (recursive)."],
        ["Clustering (node)", "closed/total triplets in neighborhood; local cohesion."],
    ], [22 * mm, 41 * mm]))
    f.append(p("<b>Structural hole</b> = gap between sub-groups bridged by 1 node ⇒ <b>high betweenness</b>; that node controls info flow (broker, competitive advantage)."))
    f.append(tip("<b>Seeding by goal</b>: non-contagious post, reach many → <b>degree</b>. Reach quickly → <b>closeness</b>. Reach other influencers → <b>eigenvector</b>. Counter campaign / cut flow → <b>betweenness</b>. Reach well-knit subgroups → seed inside them."))
    f.append(code(
        "nx.degree_centrality(G)       nx.closeness_centrality(G)\n"
        "nx.betweenness_centrality(G)  nx.eigenvector_centrality(G)\n"
        "nx.clustering(G)\n"
        "top5 = sorted(c.items(), key=lambda x:x[1], reverse=True)[:5]"
    ))

    f.append(section("13 · Community Detection", TAG_SNA))
    f.append(kv([
        ["Method", "How / Limit"],
        ["Components", "<code>nx.connected_components(G)</code>; for <b>disconnected</b> communities."],
        ["Girvan-Newman", "Iteratively remove edge w/ <b>highest betweenness</b>. Heavy compute; not scalable. <b>Keeps all nodes</b>."],
        ["Stoer-Wagner", "Global <b>min cut</b> (max-flow/min-cut); only 2 communities; also gives edge connectivity."],
        ["k-Core", "Subgraph w/ every node deg ≥ k. <b>Drops sparse nodes</b>; can return 0/1 community. Not for dissecting; finds backbone."],
        ["Louvain", "Hierarchical greedy <b>modularity</b> maximization; scalable for large nets."],
    ], [22 * mm, 41 * mm]))
    f.append(p("<b>Louvain process:</b> (1) each node = own community (2) Phase 1: move node to neighbor community to ↑ modularity (3) Phase 2: collapse communities into super-nodes (4) repeat until no improvement."))
    f.append(p("<b>Modularity Q</b>: density of intra-community edges vs inter. <b>Q≈0.7</b>=strong, <b>Q≈0.2</b>=weak. <b>Pre-partition checks</b>: cohesion + centralization ⇒ does net <i>look</i> like it has communities?"))
    f.append(code(
        "from networkx.algorithms.community import girvan_newman\n"
        "next(girvan_newman(G))             # first split\n"
        "cut, parts = nx.stoer_wagner(G)    # min cut + 2 parts\n"
        "core = nx.k_core(G, k=2)           # ≥2 connections\n"
        "import community.community_louvain as cl\n"
        "parts = cl.best_partition(G)       # {node: community}"
    ))

    f.append(section("KEY QUIZ TRAPS — Web/SNA", HILITE))
    f.append(p(
        "<font color='#7B2D26'><b>•</b></font> //div[@class='content']/a = <b>direct children only</b>; // = any descendant.<br/>"
        "<font color='#7B2D26'><b>•</b></font> Correct request: <b>yield Request(url='…', callback=self.parse_data)</b>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> nx.transitivity / nx.clustering DO NOT identify influential nodes (they measure cohesion).<br/>"
        "<font color='#7B2D26'><b>•</b></font> Clustering coef of node 2 in triangle {1,2,3,4 path with 1-2,1-3,1-4,2-?} — count closed triplets / total triplets in <i>neighborhood</i>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> <b>k-Core</b> is the only community method that <i>loses nodes</i>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> <b>Stoer-Wagner</b> also yields edge connectivity.<br/>"
        "<font color='#7B2D26'><b>•</b></font> <b>Louvain</b> = best for large networks (greedy modularity).<br/>"
        "<font color='#7B2D26'><b>•</b></font> Modularity Q is the <i>post-partition</i> indicator; cohesion+centralization are <i>pre-partition</i>.<br/>"
    ))

    f.append(section("FAST-RECALL CARDS", NAVY))
    f.append(p(
        "<b>BoW vs One-hot:</b> BoW=sum of one-hots, no order. One-hot keeps order, very high-dim.<br/>"
        "<b>TF-IDF higher when:</b> common in <i>this</i> doc, rare in corpus.<br/>"
        "<b>Cosine vs Jaccard:</b> cosine=angle (continuous); Jaccard=set overlap (binary).<br/>"
        "<b>K-means vs LDA:</b> hard vs soft assignment; centroid vs distribution.<br/>"
        "<b>Logit β:</b> word's contribution to sentiment score (interpretable).<br/>"
        "<b>NB / SVM / DT / RF / Logit:</b> compare on same train/test by accuracy.<br/>"
        "<b>MLP shape (a,b,c):</b> 3 hidden layers a→b→c neurons.<br/>"
        "<b>Vanishing gradient:</b> RNN problem; LSTM gates fix it.<br/>"
        "<b>Batch×Epoch:</b> small batch = more updates/epoch; many epochs needed.<br/>"
        "<b>Density</b> vs <b>clustering</b>: density=overall edge frac; clustering=triangle frac.<br/>"
        "<b>Diameter:</b> longest <i>shortest</i> path.<br/>"
        "<b>Reciprocity:</b> directed only.<br/>"
        "<b>Influencer ranking:</b> degree (popular) · closeness (fast) · betweenness (broker) · eigenvector (well-connected to powerful)."
    ))

    return f


# ============================================================
# DOCUMENT
# ============================================================


def draw_chrome(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 9 * mm, width, 9 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(8 * mm, height - 6.4 * mm,
                      "CIS 434 · Social Media Analytics — Final Cheat Sheet")
    canvas.setFont("Helvetica-Oblique", 7)
    canvas.setFillColor(HILITE)
    canvas.drawRightString(width - 8 * mm, height - 6.4 * mm,
                           "Text · Web Scrape · SNA   |   70 MCQ · 90 min")
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.4)
    canvas.line(8 * mm, 7 * mm, width - 8 * mm, 7 * mm)
    canvas.setFillColor(ACCENT)
    canvas.setFont("Helvetica-Oblique", 5.6)
    canvas.drawString(8 * mm, 4.8 * mm,
                      "Built from S1–S13 + Review Text + Review SNA & Web.")
    canvas.drawRightString(width - 8 * mm, 4.8 * mm,
                           f"Page {doc.page} / 2")
    canvas.setStrokeColor(RULE)
    canvas.line(width / 2, 9 * mm, width / 2, height - 10 * mm)
    canvas.restoreState()


def build():
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    width, height = A4
    margin_x = 6 * mm
    top = height - 11 * mm
    bot = 8 * mm
    gutter = 3 * mm
    col_w = (width - 2 * margin_x - gutter) / 2
    col_h = top - bot

    left = Frame(margin_x, bot, col_w, col_h, id="left",
                 leftPadding=1.5, rightPadding=2.5, topPadding=1, bottomPadding=1, showBoundary=0)
    right = Frame(margin_x + col_w + gutter, bot, col_w, col_h, id="right",
                  leftPadding=2.5, rightPadding=1.5, topPadding=1, bottomPadding=1, showBoundary=0)

    template = PageTemplate(id="2col", frames=[left, right], onPage=draw_chrome)

    doc = BaseDocTemplate(
        str(OUT_PATH), pagesize=A4,
        leftMargin=margin_x, rightMargin=margin_x,
        topMargin=11 * mm, bottomMargin=8 * mm,
        title="Social Media Analytics Final Cheat Sheet",
        author="Built from CIS 434 lecture decks",
    )
    doc.addPageTemplates([template])

    story: list = []
    for it in page1_left():
        story.append(it)
    story.append(FrameBreak())
    for it in page1_right():
        story.append(it)
    story.append(PageBreak())
    for it in page2_left():
        story.append(it)
    story.append(FrameBreak())
    for it in page2_right():
        story.append(it)

    doc.build(story)
    print(f"Wrote {OUT_PATH} ({OUT_PATH.stat().st_size:,} bytes)")


if __name__ == "__main__":
    build()
