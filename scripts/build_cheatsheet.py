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
TAG_EVAL = HexColor("#5D4037")


def make_styles() -> dict[str, ParagraphStyle]:
    base = ParagraphStyle(
        "base", fontName="Helvetica", fontSize=5.7, leading=6.6,
        textColor=INK, spaceAfter=0,
    )
    return {
        "section": ParagraphStyle(
            "section", parent=base, fontName="Helvetica-Bold",
            fontSize=7.2, leading=8.2, textColor=colors.white, backColor=NAVY,
            borderPadding=(1.2, 2.5, 1.2, 2.5), spaceBefore=2.0, spaceAfter=0.8,
        ),
        "h": ParagraphStyle(
            "h", parent=base, fontName="Helvetica-Bold", fontSize=6.2,
            leading=7.2, textColor=NAVY, spaceBefore=0.8, spaceAfter=0.2,
        ),
        "body": base,
        "tip": ParagraphStyle(
            "tip", parent=base, fontName="Helvetica-Oblique", fontSize=5.5,
            leading=6.5, textColor=TAG_TEXT,
        ),
        "code": ParagraphStyle(
            "code", parent=base, fontName="Courier", fontSize=5.2,
            leading=6.0, textColor=CODE_FG, backColor=CODE_BG,
            borderPadding=(1.2, 2.2, 1.2, 2.2), spaceBefore=0.4, spaceAfter=0.4,
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
        ("FONT", (0, 0), (-1, -1), "Helvetica", 5.6),
        ("LEADING", (0, 0), (-1, -1), 6.5),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0.4),
        ("TOPPADDING", (0, 0), (-1, -1), 0.4),
        ("LEFTPADDING", (0, 0), (-1, -1), 1.6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 1.6),
        ("BACKGROUND", (0, 0), (-1, 0), SOFT),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 5.7),
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
        ["min_df", "Drop rare tokens (don't generalize)."],
    ], [16 * mm, 47 * mm]))
    f.append(code(
        "from nltk.tokenize import word_tokenize\n"
        "from nltk.stem import PorterStemmer, WordNetLemmatizer\n"
        "from sklearn.feature_extraction.text import CountVectorizer\n"
        "X = CountVectorizer(stop_words='english', min_df=2).fit_transform(corpus)"
    ))

    f.append(section("2 · TF-IDF · N-gram · POS", TAG_TEXT))
    f.append(p("<b>TF·IDF = (k/n) · log(N/df)</b>. k=term count in doc; n=#terms in doc; N=corpus; df=docs containing term. High when frequent here, rare in corpus."))
    f.append(tip("1000 docs, doc has 25 terms, 'unstructured' appears 3× and in ⅕ of docs (df=200) → <b>(3·log 5)/25</b>."))
    f.append(p("<b>n-grams</b> capture local order: 'not good'≠'good'. W tokens → <b>W−1 bi-grams</b>, <b>W−2 tri-grams</b>. Ex: 'Social media generates lots of unstructured data' (7) → <b>6 bi-grams</b>."))
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
    f.append(p("<b>K-Means steps:</b> (1) pick k (2) init k centroids (3) assign each doc to nearest centroid (4) recompute centroids = mean of members (5) repeat until stable. <b>Topic words</b> = top-weighted terms in each centroid vector."))
    f.append(code(
        "from sklearn.cluster import KMeans, AgglomerativeClustering\n"
        "from sklearn.decomposition import LatentDirichletAllocation as LDA\n"
        "km = KMeans(n_clusters=5).fit(X);  lda = LDA(n_components=5).fit(X)\n"
        "from sklearn.metrics.pairwise import cosine_similarity\n"
        "cosine_similarity(X[0], X[1])"
    ))

    f.append(section("4 · Sentiment · Logit · VADER", TAG_TEXT))
    f.append(p("<b>Sentiment</b> = classify tone (pos/neg/neu). Score = <b>weighted sum</b> of word presence × sentiment weight: <b>s = x·β</b>; label by cutoff (s &gt; 0 → pos)."))
    f.append(p("<b>VADER</b> = lexicon-based polarity (no training). Adjusts for caps, '!!!', booster/negation, slang. <code>sid.polarity_scores(text)</code> → {neg, neu, pos, <b>compound</b> ∈ [−1,1]}. ≥0.05 pos, ≤−0.05 neg."))
    f.append(p("<b>Logit:</b> P = 1/(1+e<sup>−Xβ</sup>). <b>β = per-word sentiment weights</b> (interpretable). β learned by maximizing log-likelihood on labeled data; iterate until accuracy stops improving."))
    f.append(p("<b>Train/test split</b> mandatory ⇒ tests <b>generalization</b>. Without it, accuracy is inflated by overfit."))
    f.append(code(
        "from nltk.sentiment.vader import SentimentIntensityAnalyzer\n"
        "sid = SentimentIntensityAnalyzer();  sid.polarity_scores(text)\n"
        "from sklearn.linear_model import LogisticRegression\n"
        "model.fit(train_x, train_c);  y_pred = model.predict(test_x)\n"
        "acc = accuracy_score(test_c, y_pred)   # (true, predicted)"
    ))

    f.append(section("5 · Other Classifiers", TAG_TEXT))
    f.append(kv([
        ["Model", "Idea / formula"],
        ["Naive Bayes", "Bayes rule: <b>P(c|x) ∝ P(x|c)·P(c)</b>. Assumes feature <b>independence</b>; ~70% acc baseline."],
        ["SVM", "Find hyperplane <b>w·x − b = 0</b> w/ <b>max margin</b>; support vectors = points on margin. Kernels (poly) → non-linear."],
        ["Decision Tree", "Flow-chart splits until leaf has ~homogeneous labels. Interpretable; overfits."],
        ["Random Forest", "Many trees + <b>bagging (bootstrap aggregating)</b> on rows+features → majority vote → cuts variance/overfit."],
        ["Logit", "Linear, interpretable β/term; equivalent to ANN w/ 0 hidden layers."],
    ], [16 * mm, 47 * mm]))
    f.append(tip("RF overfits (train≫test) ⇒ <b>raise bootstrap subsampling</b> of features+rows. Don't deepen / don't drop trees / don't switch features."))
    f.append(p("<b>Fair contest:</b> same train/test + same features; compare on <b>test accuracy</b>. <b>Overfit</b> = train acc &gt; test acc (learned noise)."))
    f.append(p("<b>Improve model:</b> refine rep (n-grams, min_df) · try different classifier · increase sample size."))
    f.append(code(
        "from sklearn.naive_bayes import MultinomialNB\n"
        "from sklearn.svm import SVC\n"
        "from sklearn.tree import DecisionTreeClassifier\n"
        "from sklearn.ensemble import RandomForestClassifier\n"
        "RF = RandomForestClassifier(n_estimators=50, max_depth=3, bootstrap=True)"
    ))

    f.append(section("6 · Eval Metrics & Confusion Matrix", TAG_EVAL))
    f.append(kv([
        ["Metric", "Formula / use"],
        ["Confusion mat", "TP / FP / FN / TN. Rows=true, cols=pred."],
        ["Accuracy", "(TP+TN)/(all). Default; bad on imbalance."],
        ["Precision", "TP/(TP+FP). Spam-style: avoid false alarm."],
        ["Recall (TPR)", "TP/(TP+FN). Disease-screen: don't miss."],
        ["F1", "2·P·R/(P+R). Harmonic mean."],
        ["FPR", "FP/(FP+TN)."],
        ["ROC", "TPR (y) vs FPR (x) over thresholds; trade-off."],
        ["AUC", "Area under ROC; higher = better separator."],
    ], [16 * mm, 47 * mm]))
    f.append(code(
        "from sklearn.metrics import (accuracy_score, precision_score,\n"
        "    recall_score, f1_score, confusion_matrix, roc_auc_score)\n"
        "accuracy_score(y_true, y_pred)   # ALWAYS (true, pred)"
    ))

    return f


def page1_right() -> list:
    f: list = []

    f.append(section("7 · Neural Networks + Images", TAG_DL))
    f.append(p("<b>Neuron:</b> a = f(Σ wᵢxᵢ + b). <b>Activations:</b> ReLU max(0,x), sigmoid 1/(1+e<sup>−x</sup>), tanh, softmax (multi-class). Add non-linearity."))
    f.append(p("<b>vs Logit/SVM:</b> stacks many <b>hidden layers</b> → learns non-linear hierarchical features (low → mid → high). Logit = ANN with 0 hidden layers."))
    f.append(p("<b>Param count</b> dominated by <b>1st layer</b> (depends on input size). 400×400×3 input → 1 hidden of 480k ≈ <b>230B params</b>; 1 hidden of 1k ≈ <b>480M</b>. <b>Deep+narrow ≪ shallow+wide</b> for same capacity."))
    f.append(tip("<b>MLPClassifier(hidden_layer_sizes=(2,3))</b> = <b>2 hidden layers</b>: 1st has 2 neurons, 2nd has 3. <b>(3,2)</b> = 3-then-2."))
    f.append(p("<b>Image:</b> flatten 2D RGB to vector. 100×200×3 → <b>60000 dims = (60000,1)</b>. Then any classic ML applies."))
    f.append(p("<b>DL needs big data:</b> beats traditional only at large data; otherwise overfits. Pro: more functions. Con: more params, more data."))
    f.append(code(
        "from sklearn.neural_network import MLPClassifier\n"
        "DL = MLPClassifier(solver='lbfgs', hidden_layer_sizes=(3,2),\n"
        "                   activation='relu', random_state=1)\n"
        "DL.fit(train_x, train_c); accuracy_score(test_c, DL.predict(test_x))"
    ))

    f.append(section("8 · Word Embedding", TAG_DL))
    f.append(kv([
        ["Encoding", "Properties"],
        ["Index", "word→int. <b>Preserves order</b>; no semantics."],
        ["One-hot", "Binary vector/word; orthogonal ⇒ <b>no similarity</b>; sparse."],
        ["BoW", "Sum of one-hots; <b>loses</b> order."],
        ["N-gram rep", "Phrase-level local order."],
        ["POS rep", "Order within short sentence."],
        ["W2V / GloVe", "<b>Dense, low-dim</b>; distance ≈ semantic similarity."],
    ], [16 * mm, 47 * mm]))
    f.append(tip("Padded one-hot for K docs, max len L, vocab V → shape <b>(K, L, V)</b>. e.g. 123 docs, max 50, V=4000 → <b>(123, 50, 4000)</b>."))
    f.append(p("<b>Semantic arithmetic:</b> king − man + woman ≈ queen. <b>Pre-trained</b> (Google W2V, Stanford GloVe) = dict {term: vec}; great for small/noisy data."))
    f.append(p("<b>Embedding layer</b> in NN = trainable dense vectors learned during training; standard front of LSTM/RNN."))

    f.append(section("9 · RNN + LSTM + Seq2Seq", TAG_DL))
    f.append(p("<b>Order matters</b> for translation, chatbot, sentiment ⇒ use order-preserving rep (index/one-hot)."))
    f.append(p("<b>RNN:</b> <b>1 unit reused</b> across time-steps; hidden state carries memory. <b>A step is NOT a unit.</b> Params depend only on per-step input ⇒ huge savings vs flattened."))
    f.append(p("<b>Vanishing/exploding gradient:</b> backprop thru long seq fails ⇒ only later tokens learned. <b>LSTM</b> adds <b>memory cell + input/forget/output gates</b> ⇒ keeps long-range deps; learns earlier tokens. Built-in attention."))
    f.append(tip("<b>Batch size</b> = #samples before weight update (memory). <b>Epoch</b> = 1 full pass. Need many epochs with batches so early batches re-seen after late batches."))
    f.append(p("<b>Padding:</b> all docs same length L via <code>pad_sequences(x, maxlen=L)</code> (truncate longer, pad shorter w/ 0)."))
    f.append(p("<b>Seq2Seq:</b> <b>Encoder</b> reads input seq → context vec → <b>Decoder</b> generates output seq token-by-token. _START / _END tokens. Translation, chatbot."))
    f.append(code(
        "from keras.preprocessing.sequence import pad_sequences\n"
        "x_train = pad_sequences(x_train, maxlen=80)\n"
        "model = Sequential()\n"
        "model.add(Embedding(V+1, 40, input_length=80))\n"
        "model.add(LSTM(32, dropout=0.2))\n"
        "model.add(Dense(1, activation='sigmoid'))\n"
        "model.compile(loss='binary_crossentropy', optimizer='adam',\n"
        "              metrics=['accuracy'])\n"
        "model.fit(x_train, y, batch_size=32, epochs=3)"
    ))

    f.append(section("10 · Activations · Losses · Outputs", TAG_DL))
    f.append(kv([
        ["Activation", "Use"],
        ["ReLU max(0,x)", "Hidden layers default; cheap, no vanishing on positive side."],
        ["Sigmoid", "<b>Binary</b> output; squashes to (0,1)."],
        ["Tanh", "Hidden, zero-centered; (−1,1)."],
        ["Softmax", "<b>Multi-class</b> output; probabilities sum 1."],
    ], [22 * mm, 41 * mm]))
    f.append(kv([
        ["Output / Loss", "Pair"],
        ["Binary", "sigmoid + <b>binary_crossentropy</b>"],
        ["Multinomial", "softmax + <b>categorical_crossentropy</b>"],
        ["Continuous", "linear + <b>MSE</b>"],
        ["Optimizer", "<b>adam</b> (default), lbfgs (sklearn small)"],
    ], [22 * mm, 41 * mm]))

    f.append(section("11 · Shapes & Param-count Cheats", TAG_DL))
    f.append(kv([
        ["Object", "Shape / count"],
        ["BoW matrix", "(N_docs, V)"],
        ["TF-IDF matrix", "(N_docs, V)"],
        ["Padded one-hot", "(N_docs, L, V)"],
        ["Embedded seq", "(N_docs, L, d) — d≪V"],
        ["Image flattened", "(H·W·C, 1) e.g. 100×200×3 = (60000,1)"],
        ["MLP layer params", "≈ in_dim × out_dim (+ biases)"],
        ["1st-layer params", "= V × neurons (dominates total)"],
        ["RNN params", "= per-step input × hidden (reused across t)"],
    ], [22 * mm, 41 * mm]))

    f.append(section("KEY QUIZ TRAPS — Text/DL", HILITE))
    f.append(p(
        "<font color='#7B2D26'><b>•</b></font> Term-doc matrix represents <b>word frequencies across docs</b>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> Lemmatization = <b>dictionary mapping</b> (not stemming).<br/>"
        "<font color='#7B2D26'><b>•</b></font> Cosine = <b>angle</b> between vectors.<br/>"
        "<font color='#7B2D26'><b>•</b></font> LDA improvement: <b>overlapping topic membership</b>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> accuracy_score args = <b>(test_c, y_pred)</b>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> Logit β = <b>sentiment weights per term</b>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> Embedding > one-hot ⇒ <b>semantic similarity preserved</b>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> LSTM solves <b>vanishing gradient</b>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> RF overfit fix: <b>bootstrap aggregating</b>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> hidden_layer_sizes=(2,3) → <b>2 layers, 2 then 3</b> neurons.<br/>"
        "<font color='#7B2D26'><b>•</b></font> A step in RNN is <b>not</b> a unit; one unit handles full seq.<br/>"
        "<font color='#7B2D26'><b>•</b></font> Test split's purpose: <b>evaluate generalization</b>.<br/>"
    ))

    return f


def page2_left() -> list:
    f: list = []

    f.append(section("12 · Web Scrape (Scrapy + XPath)", TAG_WEB))
    f.append(p("<b>HTML</b> = nested tags w/ <b>id</b> (unique) + <b>class</b> (reusable). XPath queries the tree. CLI: <code>scrapy crawl spider_name -o out.csv</code>."))
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

    f.append(section("13 · Network Basics + Representation", TAG_SNA))
    f.append(p("<b>Network</b>=nodes (vertices) + edges (ties). <b>Undirected</b> (FB friend, kinship) vs <b>Directed</b> (Twitter follow): tail→head."))
    f.append(p("<b>Walk</b>=any edge sequence. <b>Path</b>=no repeat nodes. <b>Cycle</b>=closed path. <b>Geodesic</b>=shortest path; geodesic distance = its length. <b>Component</b>=maximal connected subgraph. <b>Strongly connected</b>=path between every pair (directed). <b>Neighborhood</b>=directly connected nodes."))
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

    f.append(section("14 · Network Diagnosis (network-level)", TAG_SNA))
    f.append(kv([
        ["Metric", "Formula / meaning"],
        ["Density", "2|E|/(|V|(|V|−1)) undir; halved for directed."],
        ["Avg degree", "Σ deg(v)/|V|."],
        ["Clustering (transitivity)", "closed triplets / triplets (triangles)."],
        ["Diameter", "<b>max</b> shortest-path; undirected only; K-level→2K."],
        ["Connectivity", "min nodes/edges to disconnect → robustness."],
        ["Reciprocity", "sym edges/total (directed only)."],
        ["Centralization", "spread of centrality across nodes."],
    ], [25 * mm, 38 * mm]))
    f.append(tip("Same density ≠ same speed: <b>clustered edges = local groups</b> (slow spread); dispersed edges spread fast. Same clustering also ≠ same speed."))
    f.append(code(
        "nx.density(G)            nx.transitivity(G)\n"
        "nx.diameter(G)           nx.node_connectivity(G)\n"
        "nx.edge_connectivity(G)  nx.reciprocity(G)\n"
        "# Degree centralization:\n"
        "max_d = max(dict(G.degree()).values())\n"
        "centzn = sum(max_d - d for d in dict(G.degree()).values()) \\\n"
        "         / ((N-1)*(N-2))"
    ))

    f.append(section("15 · Worked Mini-Examples", TAG_SNA))
    f.append(p("<b>Density (5 edges, 4 nodes, undirected):</b> max=4·3/2=6 → 5/6=<b>0.83</b>."))
    f.append(p("<b>Node clustering:</b> count closed triplets / total triplets in a node's <i>neighborhood</i>. Node connected to 2,3 with 2-3 edge → 1/1 = <b>1</b>. Triangle of 4 with center → coef <b>0</b> (no neighbor-neighbor edges)."))
    f.append(p("<b>Closeness of node v:</b> 1/avg geodesic. Path A-B-C-D-E from B: 1/((1+1+2+3)/4)=4/7."))
    f.append(p("<b>Reciprocity</b> (5 directed edges, 2 reciprocal pairs=4 sym edges): 2/5 = 0.4."))
    f.append(p("<b>Bi-grams of N tokens:</b> N−1. <b>Tri-grams:</b> N−2."))

    return f


def page2_right() -> list:
    f: list = []

    f.append(section("16 · Node Centrality (Influencers)", TAG_SNA))
    f.append(kv([
        ["Centrality", "Captures / pick when…"],
        ["Degree", "# direct connections; reach <b>immediate</b> neighbors. In-deg=followers; out-deg=followings."],
        ["Closeness", "1/mean geodesic to all; <b>speed of reach</b>."],
        ["Betweenness", "# geodesics through node; <b>broker</b>/gatekeeper; cuts flow."],
        ["Eigenvector", "Connected to <b>other influential</b> nodes (recursive)."],
        ["Clustering (node)", "closed/total triplets in nbhd; local cohesion."],
    ], [22 * mm, 41 * mm]))
    f.append(p("<b>Structural hole</b> = gap between sub-groups bridged by 1 node ⇒ <b>high betweenness</b>; broker controls info flow → competitive advantage."))
    f.append(tip("<b>Seed picking by goal</b>: non-contagious + reach many → <b>degree</b>. Reach quickly → <b>closeness</b>. Reach other influencers → <b>eigenvector</b>. Counter campaign / cut flow → <b>betweenness</b>. Reach well-knit subgroups → seed inside them."))
    f.append(code(
        "nx.degree_centrality(G)       nx.closeness_centrality(G)\n"
        "nx.betweenness_centrality(G)  nx.eigenvector_centrality(G)\n"
        "nx.clustering(G)\n"
        "top5 = sorted(c.items(), key=lambda x:x[1], reverse=True)[:5]"
    ))

    f.append(section("17 · Community Detection", TAG_SNA))
    f.append(kv([
        ["Method", "How / Limit"],
        ["Components", "<code>nx.connected_components</code>; for <b>disconnected</b> communities."],
        ["Girvan-Newman", "Iter remove edge w/ <b>highest betweenness</b>. Heavy compute. <b>Keeps all nodes</b>."],
        ["Stoer-Wagner", "Global <b>min cut</b> (max-flow); only 2 communities; also gives edge connectivity."],
        ["k-Core", "Subgraph w/ every node deg ≥ k. <b>Drops sparse nodes</b>; can return 0/1 community. Backbone, not dissection."],
        ["Louvain", "Hierarchical greedy <b>modularity</b> max; scalable for large nets."],
    ], [22 * mm, 41 * mm]))
    f.append(p("<b>Louvain process:</b> (1) each node = own community (2) <b>P1:</b> move node to neighbor community to ↑modularity (3) <b>P2:</b> collapse communities into super-nodes (4) repeat until no improvement."))
    f.append(p("<b>Modularity Q</b>: density intra-community vs inter. <b>Q≈0.7</b>=strong, <b>Q≈0.2</b>=weak. <b>Pre-partition</b> indicators: <b>cohesion</b>+<b>centralization</b> ⇒ does net <i>look</i> like it has communities?"))
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
        "<font color='#7B2D26'><b>•</b></font> //div[@class='c']/a = direct &lt;a&gt; children only.<br/>"
        "<font color='#7B2D26'><b>•</b></font> Correct: <b>yield Request(url='…', callback=self.parse_data)</b>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> nx.transitivity / nx.clustering DON'T identify influential nodes (cohesion).<br/>"
        "<font color='#7B2D26'><b>•</b></font> <b>k-Core</b> is the only community method that <i>loses nodes</i>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> <b>Stoer-Wagner</b> also yields edge connectivity.<br/>"
        "<font color='#7B2D26'><b>•</b></font> <b>Louvain</b> is best for large networks (greedy modularity).<br/>"
        "<font color='#7B2D26'><b>•</b></font> Modularity Q is <i>post-partition</i>; cohesion+centralization are <i>pre-partition</i>.<br/>"
        "<font color='#7B2D26'><b>•</b></font> Diameter undirected only; reciprocity directed only.<br/>"
        "<font color='#7B2D26'><b>•</b></font> 'Most influential' candidates = degree, betweenness, closeness, eigenvector — NOT clustering / transitivity.<br/>"
    ))

    f.append(section("FAST-RECALL CARDS", NAVY))
    f.append(p(
        "<b>BoW vs One-hot:</b> BoW = sum of one-hots, no order. One-hot keeps order, very high-dim.<br/>"
        "<b>TF-IDF higher when:</b> common in <i>this</i> doc, rare in corpus.<br/>"
        "<b>Cosine vs Jaccard:</b> cosine=angle (continuous); Jaccard=set overlap (binary).<br/>"
        "<b>K-Means vs LDA:</b> hard vs soft; centroid vs distribution.<br/>"
        "<b>Logit β:</b> word's contribution to sentiment (interpretable).<br/>"
        "<b>NB / SVM / DT / RF / Logit:</b> compare on same train/test by accuracy.<br/>"
        "<b>MLP shape (a,b,c):</b> 3 hidden layers a→b→c neurons.<br/>"
        "<b>Vanishing grad:</b> RNN issue; LSTM gates fix it.<br/>"
        "<b>Batch×Epoch:</b> small batch ⇒ more updates/epoch; many epochs needed.<br/>"
        "<b>Density</b> vs <b>clustering</b>: density=overall edge frac; clustering=triangle frac.<br/>"
        "<b>Diameter:</b> longest <i>shortest</i> path.<br/>"
        "<b>Reciprocity:</b> directed only.<br/>"
        "<b>Centrality summary:</b> degree (popular) · closeness (fast) · betweenness (broker) · eigenvector (well-connected to powerful).<br/>"
        "<b>Components</b> = disconnected; <b>Girvan-Newman</b> = remove top-betweenness edges; <b>Stoer-Wagner</b> = global min cut; <b>k-Core</b> = strip sparse; <b>Louvain</b> = modularity, scalable.<br/>"
        "<b>Pre-partition</b>: cohesion + centralization. <b>Post</b>: modularity Q.<br/>"
        "<b>Influencer pricing:</b> nano 1k–10k · micro 10k–100k · mid 100k–500k · macro 500k–1M · mega 1M+.<br/>"
    ))

    f.append(section("MGP SCENARIO — WHICH NET / SEED?", TAG_SNA))
    f.append(p(
        "<b>Highly contagious + unlimited time + many seeds</b> → big, well-connected net (high avg degree).<br/>"
        "<b>Very limited time</b> → low-diameter net + high-closeness seed.<br/>"
        "<b>Not contagious + 1 seed, reach many</b> → high-degree node in dense net.<br/>"
        "<b>Not contagious + counter rival post</b> → high-betweenness node (cuts spread paths).<br/>"
        "<b>Reach other influencers first</b> → high-eigenvector seed.<br/>"
        "<b>Reach well-connected sub-groups</b> → seed inside dense communities (k-Core / Louvain).<br/>"
        "<b>Reach all in shortest time, contagious</b> → small-diameter, high-clustering net.<br/>"
    ))

    return f


# ============================================================
# DOCUMENT
# ============================================================


def draw_chrome(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 8 * mm, width, 8 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(7 * mm, height - 5.6 * mm,
                      "CIS 434 · Social Media Analytics — Final Cheat Sheet")
    canvas.setFont("Helvetica-Oblique", 6.6)
    canvas.setFillColor(HILITE)
    canvas.drawRightString(width - 7 * mm, height - 5.6 * mm,
                           "Text · Web · SNA   |   70 MCQ · 90 min")
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.4)
    canvas.line(7 * mm, 5.5 * mm, width - 7 * mm, 5.5 * mm)
    canvas.setFillColor(ACCENT)
    canvas.setFont("Helvetica-Oblique", 5.4)
    canvas.drawString(7 * mm, 3.6 * mm,
                      "Built from S1–S13 + Review Text + Review SNA & Web.")
    canvas.drawRightString(width - 7 * mm, 3.6 * mm,
                           f"Page {doc.page} / 2")
    canvas.setStrokeColor(RULE)
    canvas.line(width / 2, 7 * mm, width / 2, height - 9 * mm)
    canvas.restoreState()


def build():
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    width, height = A4
    margin_x = 5 * mm
    top = height - 9.5 * mm
    bot = 6.5 * mm
    gutter = 2.5 * mm
    col_w = (width - 2 * margin_x - gutter) / 2
    col_h = top - bot

    left = Frame(margin_x, bot, col_w, col_h, id="left",
                 leftPadding=1.2, rightPadding=2.2, topPadding=0.8, bottomPadding=0.8, showBoundary=0)
    right = Frame(margin_x + col_w + gutter, bot, col_w, col_h, id="right",
                  leftPadding=2.2, rightPadding=1.2, topPadding=0.8, bottomPadding=0.8, showBoundary=0)

    template = PageTemplate(id="2col", frames=[left, right], onPage=draw_chrome)

    doc = BaseDocTemplate(
        str(OUT_PATH), pagesize=A4,
        leftMargin=margin_x, rightMargin=margin_x,
        topMargin=9.5 * mm, bottomMargin=6.5 * mm,
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
