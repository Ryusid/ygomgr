# 🎴 YGO Manager (Yu-Gi-Oh Card & Deck Manager)

A self-hosted, full-stack application to track Yu-Gi-Oh! card collections, manage decks, and calculate needed cards across decks.

Featuring a **FastAPI backend**, **MariaDB database**, **Next.js frontend**, and **Kustomize Kubernetes manifests** ready for `kubeadm` home clusters.

---

## 🌟 Key Features

- 🃏 **Card Search & Auto-Completion**: Powered by the YGOPRODeck dataset with instant search filters (Type, Race/Subtype, Attribute, Archetype, ATK, DEF, Level/Rank/Link).
- 📦 **Collection Management**: Easily track owned card quantities.
- ⚔️ **Interactive Deck Builder**: Categorizes cards into **Main**, **Extra**, and **Side** decks.
- 📊 **Deck Usage Cross-Referencing**: Calculates missing cards across all your decks vs. your owned collection.
- 🛢️ **Self-Hosted Stack**: Replaces SaaS backends (e.g. Supabase) with a lightweight FastAPI service and MariaDB instance.
- ☸️ **Kubernetes-Ready**: Ships with Kustomize manifests (`k8s/base` & `k8s/overlays/dev`) supporting `kubeadm` clusters, containerd, and optional in-cluster registry.
- 🔄 **Supabase Migration Script**: Automated tool to import existing collections & decks from Supabase to MariaDB.

---

## 📁 Repository Structure

```text
ygomgr/
├── backend/                  # FastAPI Backend Service
│   ├── main.py               # FastAPI application entry point
│   ├── database.py           # SQLAlchemy MariaDB connection setup
│   ├── models.py             # ORM models (Card, CollectionCard, Deck, DeckCard)
│   ├── schemas.py            # Pydantic validation schemas
│   ├── init.sql              # Initial MariaDB schema
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Container image build for backend
│   ├── routers/              # API endpoints (cards, collection, decks, etc.)
│   └── scripts/
│       ├── import_cards.py           # YGOPRODeck bulk dataset importer
│       └── migrate_from_supabase.py  # Supabase to MariaDB data migration script
├── ygo-collection-app/       # Next.js Frontend App
│   ├── src/                  # React pages, components, & API proxy routes
│   ├── Dockerfile            # Multi-stage container build for frontend
│   └── package.json
└── k8s/                      # Kustomize Kubernetes Manifests
    ├── base/                 # Namespace, MariaDB PVC, Deployments, Services, Secret, ConfigMap
    └── overlays/dev/         # Environment overlay & Ingress rules
```

---

## 🚀 Quick Start & Deployment

### 1. Data Migration from Supabase (Optional)
If migrating from an existing Supabase backend, set your credentials in environment variables and run:

```bash
python backend/scripts/migrate_from_supabase.py
```

### 2. Build Container Images

```bash
# Build FastAPI Backend
docker build -t ygomgr-backend:1.0.0 -f backend/Dockerfile .

# Build Next.js Frontend
docker build -t ygomgr-frontend:1.0.0 -f ygo-collection-app/Dockerfile ./ygo-collection-app
```

### 3. Deploy to `kubeadm` Kubernetes Cluster

#### Method A: Direct containerd Import
Save the built images to tarballs and import them into containerd on your worker node(s):

```bash
docker save ygomgr-backend:1.0.0 -o backend.tar
docker save ygomgr-frontend:1.0.0 -o frontend.tar

# On your kubeadm node:
sudo ctr -n k8s.io images import backend.tar
sudo ctr -n k8s.io images import frontend.tar
```

#### Method B: Apply Manifests with Kustomize

```bash
kubectl apply -k k8s/overlays/dev
```

---

## 🛠️ Environment Configuration

| Variable | Description | Default |
|---|---|---|
| `MARIADB_HOST` | Database host | `mariadb` |
| `MARIADB_PORT` | Database port | `3306` |
| `MARIADB_DATABASE` | Database name | `ygomgr` |
| `MARIADB_USER` | Database username | `ygouser` |
| `BACKEND_URL` | Backend URL for Next.js API calls | `http://backend:8000` |

---

## 📄 License
MIT License
