import Tree from "react-d3-tree";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";

/* ======================================
   Types
====================================== */

type UserNode = {
  name: string;
  id: string;
  status: string;
  phone?: string;
  email?: string;
  referredOn?: string | null;
  children?: UserNode[];
  _collapsed?: boolean; // for Tree lib
};

type TreeData = UserNode;

interface ApiUserNode {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  referredOn?: string | null;
  left: ApiUserNode[];
  right: ApiUserNode[];
}

interface RootUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/* ======================================
   Component
====================================== */

export default function AdminUsersTree() {
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    initTree();
    // eslint-disable-next-line
  }, []);

  // Helper: returns UserNode for a root with children populated via nodeRes
  const buildRootNode = async (root: RootUser): Promise<UserNode> => {
    try {
      // Fetch first-level subtree for the root
      const nodeRes = await axios.get<ApiResponse<ApiUserNode>>(
        `${API_BASE}/api/admin/users/tree/${root._id}`
      );
      console.log(nodeRes);
      const apiNode = nodeRes.data.data;
      return convertToTree(apiNode);
    } catch (err) {
      // If failed, return a node with just root basic info
      return {
        name: root.name,
        id: root._id,
        status: root.status,
        phone: root.phone,
        email: root.email,
        children: [],
        _collapsed: false,
      };
    }
  };

  // Fetch all root users & their subtrees, then wrap them under System node
  const initTree = async () => {
    try {
      setLoading(true);

      const rootsRes = await axios.get<ApiResponse<RootUser[]>>(
        `${API_BASE}/api/admin/users/roots`
      );
      const roots = rootsRes.data.data;

      // For each root user, fetch its full subtree (first-level expanded)
      const childTrees: UserNode[] = await Promise.all(
        roots.map((root) => buildRootNode(root))
      );

      // Create a top-level "System" node as wrapper
      const systemNode: UserNode = {
        name: "System",
        id: "system_node",
        status: "system",
        children: childTrees,
        _collapsed: false,
      };

      setTreeData(systemNode);

    } catch (err) {
      setError("Failed to load users tree");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Convert API user node (ApiUserNode) to UserNode (for D3)
  const convertToTree = (node: ApiUserNode): UserNode => {
    // Map left and right as children array
    const children: UserNode[] = [];
    if (Array.isArray(node.left)) {
      for (const child of node.left) {
        children.push(convertToTree(child));
      }
    }
    if (Array.isArray(node.right)) {
      for (const child of node.right) {
        children.push(convertToTree(child));
      }
    }
    return {
      name: node.name,
      id: node._id,
      status: node.status,
      phone: node.phone,
      email: node.email,
      referredOn: node.referredOn ?? null,
      children: children.length ? children : undefined,
      _collapsed: false,
    };
  };

  // Expand a single node and fetch its children from node API -- optional, supports collapsible/expand (if tree gets larger)
  const expandNode = useCallback(
    async (node: UserNode) => {
      if (!node._collapsed) return;

      try {
        const res = await axios.get<ApiResponse<ApiUserNode>>(
          `${API_BASE}/api/admin/users/tree/${node.id}`
        );
        const tree = convertToTree(res.data.data);

        node.children = tree.children ?? [];
        node._collapsed = false;

        // Force rerender
        setTreeData((prev) =>
          prev ? { ...prev } : null
        );
      } catch (err) {
        console.error("Expand failed:", err);
      }
    },
    [API_BASE]
  );

  // Node click: expand/collapse if needed
  const onNodeClick = (nodeDatum: any) => {
    if (nodeDatum._collapsed) {
      expandNode(nodeDatum);
    }
  };

  // UI states
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading users tree...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }
  if (!treeData) return null;

  // Render
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#fff", // changed from blue to white
      }}
    >
      <Tree
        data={treeData}
        zoomable
        collapsible
        orientation="vertical"
        onNodeClick={onNodeClick}
        separation={{ siblings: 1.5, nonSiblings: 2 }}
        translate={{
          x: window.innerWidth / 2,
          y: 80,
        }}
        pathFunc="diagonal"
        renderCustomNodeElement={(rd3tProps: any) => (
          <foreignObject
            y={-25}
            x={-75}
            width={180}
            height={70}
            style={{ overflow: "visible" }}
          >
            <div
              style={{
                color: '#1e293b',
                background: '#f3f4f6',
                borderRadius: 8,
                padding: '4px 8px',
                border: '1px solid #cbd5e1',
                minWidth: 160,
                cursor: "pointer",
                userSelect: "none"
              }}
              // Attach the onClick directly to enable expand/collapse
              onClick={(e) => {
                e.stopPropagation();
                if (typeof rd3tProps.toggleNode === "function") {
                  rd3tProps.toggleNode();
                }
              }}
              title="Click to expand/collapse"
            >
              <div style={{ fontWeight: 600 }}>{rd3tProps.nodeDatum.name}</div>
              {rd3tProps.nodeDatum.status && (
                <div style={{
                  fontSize: 12,
                  color:
                    rd3tProps.nodeDatum.status === "active"
                      ? "#22c55e"
                      : rd3tProps.nodeDatum.status === "suspended"
                        ? "#f59e42"
                        : rd3tProps.nodeDatum.status === "system"
                          ? "#22d3ee"
                          : "#ef4444"
                }}>
                  {rd3tProps.nodeDatum.status}
                </div>
              )}
              {rd3tProps.nodeDatum.referredOn && (
                <div style={{ fontSize: 11, color: "#f472b6" }}>Side: {rd3tProps.nodeDatum.referredOn}</div>
              )}
              {rd3tProps.nodeDatum.phone && (
                <div style={{ fontSize: 12, color: "#60a5fa" }}>{rd3tProps.nodeDatum.phone}</div>
              )}
              {rd3tProps.nodeDatum.email && (
                <div style={{ fontSize: 12, color: "black" }}>{rd3tProps.nodeDatum.email}</div>
              )}
            </div>
          </foreignObject>
        )}
      />
    </div>
  );
}
