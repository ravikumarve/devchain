const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [ordersThisMonth, ordersLastMonth, products, allSellerStats] = await Promise.all([
      prisma.order.findMany({
        where: {
          product: { sellerId },
          createdAt: { gte: startOfThisMonth }
        },
        include: {
          product: { select: { id: true, title: true } }
        }
      }),
      prisma.order.findMany({
        where: {
          product: { sellerId },
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
        }
      }),
      prisma.product.findMany({
        where: { sellerId, deletedAt: null },
        include: {
          _count: { select: { orders: true } },
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true }
          }
        }
      }),
      prisma.order.groupBy({
        by: ['productId'],
        _count: true,
        _sum: { amountPaid: true },
      })
    ]);

    const totalRevenueThisMonth = ordersThisMonth.reduce((sum, o) => sum + o.amountPaid, 0);
    const totalRevenueLastMonth = ordersLastMonth.reduce((sum, o) => sum + o.amountPaid, 0);
    const revenueChange = totalRevenueThisMonth - totalRevenueLastMonth;
    const revenueChangePercent = totalRevenueLastMonth > 0
      ? ((revenueChange / totalRevenueLastMonth) * 100)
      : (totalRevenueThisMonth > 0 ? 100 : 0);

    const totalSalesThisMonth = ordersThisMonth.length;
    const totalSalesLastMonth = ordersLastMonth.length;
    const salesChange = totalSalesThisMonth - totalSalesLastMonth;
    const salesChangePercent = totalSalesLastMonth > 0
      ? ((salesChange / totalSalesLastMonth) * 100)
      : (totalSalesThisMonth > 0 ? 100 : 0);

    const avgOrderValue = totalSalesThisMonth > 0
      ? totalRevenueThisMonth / totalSalesThisMonth
      : 0;

    const productsWithMetrics = products.map(p => {
      const daysSinceCreated = Math.floor((now - new Date(p.createdAt)) / (1000 * 60 * 60 * 24));
      const lastSale = p.orders[0];
      const daysSinceLastSale = lastSale
        ? Math.floor((now - new Date(lastSale.createdAt)) / (1000 * 60 * 60 * 24))
        : null;

      let status = 'new';
      if (p._count.orders > 0) {
        if (daysSinceLastSale !== null && daysSinceLastSale > 30) {
          status = 'stale';
        } else if (daysSinceLastSale !== null && daysSinceLastSale <= 7) {
          status = 'hot';
        } else {
          status = 'active';
        }
      } else if (daysSinceCreated > 30) {
        status = 'stale';
      }

      return {
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category,
        isActive: p.isActive,
        salesCount: p._count.orders,
        revenue: ordersThisMonth
          .filter(o => o.product.id === p.id)
          .reduce((sum, o) => sum + o.amountPaid, 0),
        daysSinceCreated,
        daysSinceLastSale,
        status,
        lastSoldAt: lastSale ? lastSale.createdAt : null,
      };
    });

    const totalRevenueAllTime = productsWithMetrics.reduce((sum, p) => sum + p.revenue, 0);

    const insights = generateInsights(productsWithMetrics, {
      totalSalesThisMonth,
      totalRevenueThisMonth,
      totalProducts: products.length,
      avgOrderValue,
      now
    });

    const ranking = await calculateRanking(sellerId, totalRevenueAllTime);

    res.json({
      summary: {
        totalRevenue: parseFloat(totalRevenueThisMonth.toFixed(2)),
        totalSales: totalSalesThisMonth,
        totalProducts: products.length,
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        comparison: {
          revenue: {
            amount: parseFloat(revenueChange.toFixed(2)),
            percent: parseFloat(revenueChangePercent.toFixed(1)),
            direction: revenueChange >= 0 ? 'up' : 'down'
          },
          sales: {
            amount: salesChange,
            percent: parseFloat(salesChangePercent.toFixed(1)),
            direction: salesChange >= 0 ? 'up' : 'down'
          }
        }
      },
      products: productsWithMetrics.sort((a, b) => b.salesCount - a.salesCount),
      insights,
      ranking
    });

  } catch (err) {
    console.error('GetSellerAnalytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
};

function generateInsights(products, stats) {
  const insights = [];
  const staleProducts = products.filter(p => p.status === 'stale');
  const hotProducts = products.filter(p => p.status === 'hot');
  const productsWithSales = products.filter(p => p.salesCount > 0);

  if (stats.totalSalesThisMonth === 1 && stats.totalRevenueThisMonth > 0) {
    insights.push({
      type: 'success',
      icon: '🎉',
      title: 'First Sale This Month!',
      description: 'Congratulations on your first sale! Keep building momentum.',
      priority: 'high'
    });
  }

  if (staleProducts.length > 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: `${staleProducts.length} Product${staleProducts.length > 1 ? 's' : ''} Need Attention`,
      description: staleProducts.length === 1
        ? `"${staleProducts[0].title.slice(0, 30)}..." hasn't sold in 30+ days. Consider updating the description or price.`
        : 'Several products haven\'t sold recently. Review and optimize them.',
      action: 'Review Products',
      actionUrl: '/profile',
      priority: 'high'
    });
  }

  if (stats.totalProducts < 3 && stats.totalProducts > 0) {
    insights.push({
      type: 'tip',
      icon: '💡',
      title: 'Expand Your Catalog',
      description: 'Sellers with 3+ products earn 3x more on average. Consider listing another product.',
      action: 'Add Product',
      actionUrl: '/sell',
      priority: 'medium'
    });
  }

  if (stats.totalProducts === 0) {
    insights.push({
      type: 'tip',
      icon: '🚀',
      title: 'Start Selling Today',
      description: 'List your first product and join thousands of developers earning on DevChain.',
      action: 'Create Product',
      actionUrl: '/sell',
      priority: 'high'
    });
  }

  if (hotProducts.length > 0) {
    insights.push({
      type: 'success',
      icon: '🔥',
      title: 'Hot Products!',
      description: `${hotProducts.map(p => `"${p.title.slice(0, 20)}"`).join(', ')} ${hotProducts.length > 1 ? 'are' : 'is'} selling well this week!`,
      priority: 'low'
    });
  }

  if (stats.totalRevenueThisMonth >= 100 && stats.totalRevenueThisMonth < 500) {
    insights.push({
      type: 'milestone',
      icon: '⭐',
      title: '$100 Club',
      description: "You've earned over $100 this month. Keep pushing to reach $500!",
      priority: 'medium'
    });
  } else if (stats.totalRevenueThisMonth >= 500) {
    insights.push({
      type: 'milestone',
      icon: '💎',
      title: '$500 Super Seller',
      description: "You're in the top tier! Maintain your momentum.",
      priority: 'medium'
    });
  }

  if (stats.avgOrderValue > 50) {
    insights.push({
      type: 'success',
      icon: '💰',
      title: 'High-Value Sales',
      description: `Your average order value is $${stats.avgOrderValue.toFixed(0)}. Focus on premium products.`,
      priority: 'low'
    });
  }

  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

async function calculateRanking(sellerId, sellerRevenue) {
  try {
    const allSellers = await prisma.user.findMany({
      where: {
        products: { some: { isActive: true, deletedAt: null } }
      },
      include: {
        products: {
          where: { isActive: true, deletedAt: null },
          include: {
            orders: true
          }
        }
      }
    });

    const sellerRevenues = allSellers.map(s => ({
      id: s.id,
      revenue: s.products.reduce((sum, p) => sum + p.orders.reduce((os, o) => os + o.amountPaid, 0), 0)
    }));

    sellerRevenues.sort((a, b) => b.revenue - a.revenue);

    const sellerRank = sellerRevenues.findIndex(s => s.id === sellerId);
    const percentile = sellerRevenues.length > 1
      ? Math.round(((sellerRevenues.length - sellerRank - 1) / (sellerRevenues.length - 1)) * 100)
      : 99;

    let tier = 'New Seller';
    if (percentile >= 90) tier = 'Top 10% Seller';
    else if (percentile >= 75) tier = 'Top 25% Seller';
    else if (percentile >= 50) tier = 'Rising Seller';
    else if (percentile >= 25) tier = 'Established Seller';

    return {
      percentile,
      tier,
      rank: sellerRank + 1,
      totalSellers: allSellers.length
    };
  } catch (err) {
    console.error('Ranking calculation error:', err);
    return {
      percentile: 50,
      tier: 'Seller',
      rank: 1,
      totalSellers: 1
    };
  }
}

module.exports = { getSellerAnalytics };
